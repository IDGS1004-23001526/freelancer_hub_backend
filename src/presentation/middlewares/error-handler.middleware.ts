import { Request, Response, NextFunction } from 'express';
import { DomainException } from '../../domain/exceptions/domain.exception.js';
import { env } from '../../config/env.js';

/**
 * Middleware centralizado para el manejo de excepciones de dominio y errores HTTP.
 */
export const centralizedErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof DomainException) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      error: err.name,
      message: err.message,
    });
    return;
  }

  // Errores no controlados del servidor
  console.error('❌ Error no controlado en el servidor:', err);

  res.status(500).json({
    success: false,
    statusCode: 500,
    error: 'ErrorInternoServidor',
    message: 'Ocurrió un error inesperado en el servidor.',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
