/**
 * Description: Fábrica de middlewares de Rate Limiting configurable y reutilizable
 * para proteger cualquier endpoint contra abuso, fuerza bruta o spam.
 * 
 * Ejemplo de usabilidad en tus rutas:
 * 
 * const createProjectRateLimit = createRateLimitMiddleware({
        maxRequests: 10,
        windowMs: 60 * 60 * 1000, // 1 hora
        keyPrefix: 'create-project',
        message: 'Has alcanzado el límite máximo de 10 convocatorias creadas por hora.',
    });
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

export interface RateLimitOptions {
    maxRequests: number;                     // Número máximo de peticiones permitidas dentro de la ventana de tiempo
    windowMs: number;                        // Duración de la ventana de tiempo en milisegundos
    message?: string;                        // Mensaje personalizado cuando se excede el límite
    keyPrefix?: string;                      // Prefijo o identificador del recurso para aislar contadores (ej. 'create-project', 'login')
    keyGenerator?: (req: Request) => string; // Función opcional para personalizar cómo se identifica al cliente (por defecto: userId o IP)
}

export const createRateLimitMiddleware = (options: RateLimitOptions) => {
    const {
        maxRequests,
        windowMs,
        message = 'Has excedido el límite de peticiones permitidas. Intenta de nuevo más tarde.',
        keyPrefix = 'global',
        keyGenerator = (req: Request) => req.user?.sub ?? req.ip ?? 'anonymous',
    } = options;

    // El Map vive dentro del closure de cada instancia para que distintos endpoints no choquen entre sí
    const hits = new Map<string, RateLimitRecord>();

    return (req: Request, res: Response, next: NextFunction): void => {
        const now = Date.now();
        const clientIdentifier = keyGenerator(req);
        const key = `${keyPrefix}:${clientIdentifier}`;

        // Limpieza perezosa (lazy cleanup) de registros expirados para evitar fugas de memoria
        const record = hits.get(key);
        if (!record || now > record.resetTime) {
            const resetTime = now + windowMs;
            hits.set(key, { count: 1, resetTime });

            res.setHeader('X-RateLimit-Limit', String(maxRequests));
            res.setHeader('X-RateLimit-Remaining', String(maxRequests - 1));
            res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));

            next();
            return;
        }

        if (record.count >= maxRequests) {
            const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);

            res.setHeader('Retry-After', String(retryAfterSeconds));
            res.setHeader('X-RateLimit-Limit', String(maxRequests));
            res.setHeader('X-RateLimit-Remaining', '0');
            res.setHeader('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));

            res.status(429).json({
                success: false,
                statusCode: 429,
                error: 'DemasiadasPeticiones',
                message,
            });
            return;
        }

        record.count += 1;
        res.setHeader('X-RateLimit-Limit', String(maxRequests));
        res.setHeader('X-RateLimit-Remaining', String(maxRequests - record.count));
        res.setHeader('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));

        next();
    };
};