import fs from 'node:fs';
import path from 'node:path';
import { Request, Response, NextFunction } from 'express';
import {
  ILogger,
  LogLevel,
  LogMetadata,
  StructuredLogEntry,
} from '../../application/interfaces/logger.interface.js';

export interface LoggerOptions {
  logsDir?: string;
  retentionDays?: number;
  enableConsole?: boolean;
  enableFiles?: boolean;
}

export class LoggerService implements ILogger {
  private readonly logsDir: string;
  private readonly retentionDays: number;
  private readonly enableConsole: boolean;
  private readonly enableFiles: boolean;
  private readonly subscribers: Array<(entry: StructuredLogEntry) => void> = [];

  constructor(options: LoggerOptions = {}) {
    this.logsDir = options.logsDir ?? path.join(process.cwd(), 'logs');
    this.retentionDays = options.retentionDays ?? 14;
    this.enableConsole = options.enableConsole ?? true;
    this.enableFiles = options.enableFiles ?? true;

    if (this.enableFiles) {
      this.ensureLogsDirectory();
      this.cleanOldLogs();
    }
  }

  public debug(message: string, meta?: LogMetadata): void {
    this.log('DEBUG', message, meta);
  }

  public info(message: string, meta?: LogMetadata): void {
    this.log('INFO', message, meta);
  }

  public warn(message: string, meta?: LogMetadata): void {
    this.log('WARN', message, meta);
  }

  public error(
    message: string,
    errorOrMeta?: Error | LogMetadata,
    meta?: LogMetadata
  ): void {
    let resolvedMeta: LogMetadata = {};
    if (errorOrMeta instanceof Error) {
      resolvedMeta = {
        ...meta,
        error: errorOrMeta.message,
        stack: errorOrMeta.stack,
      };
    } else if (typeof errorOrMeta === 'object' && errorOrMeta !== null) {
      resolvedMeta = { ...errorOrMeta, ...meta };
    } else if (meta) {
      resolvedMeta = { ...meta };
    }

    this.log('ERROR', message, resolvedMeta);
  }

  /**
   * Permite suscribir listeners a cada log generado (ideal para aserciones en pruebas automáticas).
   * Retorna una función para cancelar la suscripción.
   */
  public onLog(callback: (entry: StructuredLogEntry) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const idx = this.subscribers.indexOf(callback);
      if (idx !== -1) {
        this.subscribers.splice(idx, 1);
      }
    };
  }

  private log(level: LogLevel, message: string, meta: LogMetadata = {}): void {
    const timestamp = new Date().toISOString();
    const { context, action, statusCode, userId, durationMs, error, stack, ...restMeta } = meta;

    const entry: StructuredLogEntry = {
      timestamp,
      level,
      message,
      ...(context ? { context } : {}),
      ...(action ? { action } : {}),
      ...(statusCode !== undefined ? { statusCode } : {}),
      ...(userId ? { userId } : {}),
      ...(durationMs !== undefined ? { durationMs } : {}),
      ...(error ? { error: typeof error === 'string' ? error : error.message } : {}),
      ...(stack ? { stack } : {}),
      ...(Object.keys(restMeta).length > 0 ? { metadata: restMeta } : {}),
    };

    // 1. Notificar a los suscriptores en memoria (para tests automáticos)
    for (const sub of this.subscribers) {
      try {
        sub(entry);
      } catch {
        // Ignorar fallas de suscriptores
      }
    }

    // 2. Salida formateada en consola
    if (this.enableConsole) {
      this.writeToConsole(entry);
    }

    // 3. Persistencia en archivos rotados diariamente
    if (this.enableFiles) {
      this.writeToFile(entry);
    }
  }

  private writeToConsole(entry: StructuredLogEntry): void {
    const colorReset = '\x1b[0m';
    const colors: Record<LogLevel, string> = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
    };

    const color = colors[entry.level] || '';
    const dateFormatted = entry.timestamp.replace('T', ' ').substring(0, 19);
    const ctx = entry.context ? `[${entry.context}]` : '';
    const act = entry.action ? `[${entry.action}]` : '';
    const status = entry.statusCode !== undefined ? `(${entry.statusCode})` : '';
    const duration = entry.durationMs !== undefined ? `+${entry.durationMs}ms` : '';
    const user = entry.userId ? `usr:${entry.userId.slice(-6)}` : '';

    const tags = [ctx, act, status, user, duration].filter(Boolean).join(' ');
    const logLine = `${color}[${entry.level}]${colorReset} ${dateFormatted} ${tags} ${entry.message}`;

    if (entry.level === 'ERROR') {
      console.error(logLine);
      if (entry.stack) {
        console.error(entry.stack);
      }
    } else if (entry.level === 'WARN') {
      console.warn(logLine);
    } else {
      console.log(logLine);
    }
  }

  private writeToFile(entry: StructuredLogEntry): void {
    try {
      const today = this.getDateString(new Date());
      const dayDir = path.join(this.logsDir, today);

      if (!fs.existsSync(dayDir)) {
        fs.mkdirSync(dayDir, { recursive: true });
      }

      const line = JSON.stringify(entry) + '\n';

      // 1. Auditoría completa del día
      const combinedPath = path.join(dayDir, 'combined.log');
      fs.appendFileSync(combinedPath, line, 'utf8');

      // 2. Errores críticos (500, excepciones no capturadas)
      if (entry.level === 'ERROR') {
        const errorPath = path.join(dayDir, 'error.log');
        fs.appendFileSync(errorPath, line, 'utf8');
      }

      // 3. Advertencias de negocio y validación (400, 401, 403, Zod)
      if (entry.level === 'WARN') {
        const warnPath = path.join(dayDir, 'warn.log');
        fs.appendFileSync(warnPath, line, 'utf8');
      }

      // 4. Módulo de Chat y WebSockets en tiempo real
      if (entry.context?.startsWith('CHAT')) {
        const chatPath = path.join(dayDir, 'chat.log');
        fs.appendFileSync(chatPath, line, 'utf8');
      }

      // 5. Módulo del Ciclo de Negocio Core (Proyectos, Propuestas, Contratos, Escrow, Hitos y Billetera)
      const businessContexts = ['PROJECT', 'PROPOSAL', 'CONTRACT', 'ESCROW', 'MILESTONE', 'WALLET'];
      if (entry.context && businessContexts.some((ctx) => entry.context?.startsWith(ctx))) {
        const businessPath = path.join(dayDir, 'business.log');
        fs.appendFileSync(businessPath, line, 'utf8');
      }

      // 6. Tráfico HTTP general
      if (entry.context === 'HTTP') {
        const httpPath = path.join(dayDir, 'http.log');
        fs.appendFileSync(httpPath, line, 'utf8');
      }
    } catch (err) {
      console.error('[LoggerService] Error al escribir en archivo de logs:', err);
    }
  }

  private ensureLogsDirectory(): void {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }
    } catch (err) {
      console.error('[LoggerService] No se pudo crear el directorio de logs:', err);
    }
  }

  /**
   * Purgado de carpetas y logs antiguos según la política de retención (ej. mayores a 14 días).
   */
  public cleanOldLogs(): void {
    try {
      if (!fs.existsSync(this.logsDir)) return;

      const entries = fs.readdirSync(this.logsDir);
      const now = Date.now();
      const maxAgeMs = this.retentionDays * 24 * 60 * 60 * 1000;

      for (const entry of entries) {
        const entryPath = path.join(this.logsDir, entry);
        const stats = fs.statSync(entryPath);

        if (stats.isDirectory()) {
          // Si es una carpeta con formato de fecha YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}$/.test(entry)) {
            const folderDate = new Date(entry).getTime();
            if (!isNaN(folderDate) && now - folderDate > maxAgeMs) {
              fs.rmSync(entryPath, { recursive: true, force: true });
            }
          } else if (now - stats.mtimeMs > maxAgeMs) {
            fs.rmSync(entryPath, { recursive: true, force: true });
          }
        } else if (entry.endsWith('.log')) {
          // Archivos sueltos heredados
          if (now - stats.mtimeMs > maxAgeMs) {
            fs.unlinkSync(entryPath);
          }
        }
      }
    } catch (err) {
      console.error('[LoggerService] Error al limpiar logs antiguos:', err);
    }
  }

  private getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Middleware de Express para registrar automáticamente cada petición HTTP
   * con código de estado, método, URL y tiempo de respuesta en milisegundos.
   */
  public createHttpMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const startTime = Date.now();
      const url = req.originalUrl || req.url;
      const method = req.method;

      res.on('finish', () => {
        const durationMs = Date.now() - startTime;
        const statusCode = res.statusCode;
        const userId = (req as any).user?.sub;

        let level: LogLevel = 'INFO';
        if (statusCode >= 500) {
          level = 'ERROR';
        } else if (statusCode >= 400) {
          level = 'WARN';
        }

        const message = `${method} ${url} -> ${statusCode} (${durationMs}ms)`;
        this.log(level, message, {
          context: 'HTTP',
          action: `${method}_${url.split('?')[0]}`,
          statusCode,
          userId,
          durationMs,
        });
      });

      next();
    };
  }
}
