import { Request, Response, NextFunction } from 'express';
import { IJwtTokenGenerator, JwtUserClaims } from '../../application/interfaces/jwt-token-generator.interface.js';
import { InvalidTokenException } from '../../domain/exceptions/domain.exception.js';
import { Container } from '../../container.js';

// Extensión de la interfaz Request de Express para inyectar claims del usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtUserClaims;
    }
  }
}

/**
 * Fábrica del middleware de autenticación por Bearer JWT.
 */
export const createAuthMiddleware = (jwtTokenGenerator: IJwtTokenGenerator) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      Container.logger.warn('Cabecera de autorización no proporcionada', {
        context: 'AUTH:MIDDLEWARE',
        action: 'UNAUTHORIZED_NO_HEADER',
        statusCode: 401,
        path: req.originalUrl || req.url,
        method: req.method,
      });
      res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'NoAutorizado',
        message: 'Cabecera de autorización no proporcionada.',
      });
      return;
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      Container.logger.warn('Formato de autorización inválido en cabecera', {
        context: 'AUTH:MIDDLEWARE',
        action: 'UNAUTHORIZED_INVALID_FORMAT',
        statusCode: 401,
        path: req.originalUrl || req.url,
        method: req.method,
      });
      res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'NoAutorizado',
        message: 'Formato de autorización inválido. Se espera "Bearer <token>".',
      });
      return;
    }

    try {
      const claims = jwtTokenGenerator.verifyAccessToken(token);
      req.user = claims;
      next();
    } catch (error) {
      if (error instanceof InvalidTokenException) {
        Container.logger.warn(`Token JWT inválido o expirado: ${error.message}`, {
          context: 'AUTH:MIDDLEWARE',
          action: 'INVALID_TOKEN',
          statusCode: 401,
          path: req.originalUrl || req.url,
          method: req.method,
        });
        res.status(401).json({
          success: false,
          statusCode: 401,
          error: 'NoAutorizado',
          message: error.message,
        });
        return;
      }
      next(error);
    }
  };
};
