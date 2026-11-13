import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware para validar el cuerpo (body) de la petición contra un esquema de Zod.
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const erroresFormateados = error.errors.map((err) => ({
          campo: err.path.join('.'),
          mensaje: err.message,
        }));

        res.status(400).json({
          success: false,
          statusCode: 400,
          error: 'PeticionInvalida',
          message: 'Falló la validación de los datos enviados.',
          detalles: erroresFormateados,
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * Middleware para validar los parámetros de consulta (query) contra un esquema de Zod.
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const erroresFormateados = error.errors.map((err) => ({
          campo: err.path.join('.'),
          mensaje: err.message,
        }));

        res.status(400).json({
          success: false,
          statusCode: 400,
          error: 'PeticionInvalida',
          message: 'Falló la validación de los parámetros de consulta.',
          detalles: erroresFormateados,
        });
        return;
      }
      next(error);
    }
  };
};
