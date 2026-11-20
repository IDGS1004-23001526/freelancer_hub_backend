import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../infrastructure/persistence/prisma/prisma.client.js';
import { Container } from '../container.js';

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

    Container.logger.info('Catálogo global de habilidades consultado', {
      context: 'CATALOG:SKILLS',
      action: 'GET_SKILLS',
      statusCode: 200,
      resultCount: skills.length,
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

