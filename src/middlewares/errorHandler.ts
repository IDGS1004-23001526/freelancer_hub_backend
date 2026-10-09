import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

/**
 * Middleware de manejo de errores genéricos para compatibilidad.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('❌ Error no controlado:', err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    statusCode,
    error: 'ErrorInternoServidor',
    message: err.message || 'Ocurrió un error inesperado en el servidor',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
