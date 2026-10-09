import { Request, Response, NextFunction } from 'express';
import { IJwtTokenGenerator, JwtUserClaims } from '../../application/interfaces/jwt-token-generator.interface.js';
import { InvalidTokenException } from '../../domain/exceptions/domain.exception.js';

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
