import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../infrastructure/persistence/prisma/prisma.client.js';

export const skillsRouter = Router();

/**
 * @ruta GET /api/v1/skills
 * @descripcion Obtiene el catálogo global de habilidades técnicas de la plataforma
 * @acceso Público
 */
skillsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: skills,
    });
  } catch (error) {
    next(error);
  }
});

