import { Request, Response, NextFunction } from 'express';
import { DomainException } from '../../domain/exceptions/domain.exception.js';
import { env } from '../../config/env.js';
import { Container } from '../../container.js';

/**
 * Middleware centralizado para el manejo de excepciones de dominio y errores HTTP.
 */
export const centralizedErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof DomainException) {
    Container.logger.warn(`Excepción de dominio: ${err.message}`, {
      context: 'DOMAIN',
      action: err.name,
      statusCode: err.statusCode,
      userId: (req as any).user?.sub,
    });
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      error: err.name,
      message: err.message,
    });
    return;
  }

  // Errores no controlados del servidor (500)
  Container.logger.error('Error no controlado en el servidor', err, {
    context: 'SERVER',
    statusCode: 500,
    userId: (req as any).user?.sub,
  });

  res.status(500).json({
    success: false,
    statusCode: 500,
    error: 'ErrorInternoServidor',
    message: 'Ocurrió un error inesperado en el servidor.',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
