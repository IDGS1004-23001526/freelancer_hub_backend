import { Request, Response, NextFunction, RequestHandler } from 'express';

export interface RateLimiterOptions {
  /** Ventana de tiempo en milisegundos (por defecto: 15 minutos) */
  windowMs?: number;
  /** Número máximo de intentos permitidos por IP dentro de la ventana (por defecto: 5) */
  maxRequests?: number;
  /** Mensaje de error personalizado al superar el límite */
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimiterMiddleware extends RequestHandler {
  /** Limpia los registros en memoria del rate limiter (útil para aislamiento en tests) */
  reset: (ip?: string) => void;
}

/**
 * Extrae de forma segura la dirección IP del cliente considerando proxies inversos.
 */
function extractClientIp(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
    return forwardedFor.split(',')[0].trim();
  }
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown-ip';
}

/**
 * Fábrica de middleware de Rate Limiting basado en ventana fija por IP (OWASP Brute-Force Mitigation).
 */
export function createRateLimiter(options: RateLimiterOptions = {}): RateLimiterMiddleware {
  const windowMs = options.windowMs ?? 15 * 60 * 1000; // 15 minutos
  const maxRequests = options.maxRequests ?? 5; // Máximo 5 intentos por IP
  const message =
    options.message ??
    'Demasiados intentos desde esta dirección IP. Por favor, inténtalo de nuevo en 15 minutos.';

  const store = new Map<string, RateLimitEntry>();

  const middleware = ((req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const clientIp = extractClientIp(req);

    // Limpieza perezosa de entradas expiradas para evitar fugas de memoria
    const current = store.get(clientIp);
    if (!current || now >= current.resetTime) {
      const entry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(clientIp, entry);

      const remaining = Math.max(0, maxRequests - entry.count);
      const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

      res.setHeader('RateLimit-Limit', String(maxRequests));
      res.setHeader('RateLimit-Remaining', String(remaining));
      res.setHeader('RateLimit-Reset', String(resetSeconds));

      next();
      return;
    }

    current.count += 1;
    const remaining = Math.max(0, maxRequests - current.count);
    const resetSeconds = Math.ceil((current.resetTime - now) / 1000);

    res.setHeader('RateLimit-Limit', String(maxRequests));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(resetSeconds));

    if (current.count > maxRequests) {
      res.setHeader('Retry-After', String(resetSeconds));
      res.status(429).json({
        success: false,
        statusCode: 429,
        error: 'TooManyRequests',
        message,
        retryAfterSeconds: resetSeconds,
      });
      return;
    }

    next();
  }) as RateLimiterMiddleware;

  middleware.reset = (ip?: string): void => {
    if (ip) {
      store.delete(ip);
    } else {
      store.clear();
    }
  };

  return middleware;
}

/**
 * Rate Limiter preconfigurado para los endpoints críticos de autenticación y registro:
 * Máximo 5 intentos por dirección IP cada 15 minutos (900,000 ms).
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message:
    'Se ha excedido el límite máximo de 5 intentos de autenticación/registro en 15 minutos.',
});
