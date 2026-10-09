import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para capturar rutas inexistentes (404 Not Found).
 */
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    error: 'RutaNoEncontrada',
    message: `Ruta no encontrada en el servidor: ${req.method} ${req.originalUrl}`,
  });
};
