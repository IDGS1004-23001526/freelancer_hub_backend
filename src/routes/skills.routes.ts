import { Router, Request, Response } from 'express';
import { prisma } from '../infrastructure/persistence/prisma/prisma.client.js';

export const skillsRouter = Router();

const DEFAULT_SKILLS = [
  { id: 'sk-1', name: 'React', slug: 'react', category: 'Frontend' },
  { id: 'sk-2', name: 'Node.js', slug: 'node-js', category: 'Backend' },
  { id: 'sk-3', name: 'TypeScript', slug: 'typescript', category: 'Lenguajes' },
  { id: 'sk-4', name: 'JavaScript', slug: 'javascript', category: 'Lenguajes' },
  { id: 'sk-5', name: 'PostgreSQL', slug: 'postgresql', category: 'Base de Datos' },
  { id: 'sk-6', name: 'Docker', slug: 'docker', category: 'DevOps' },
  { id: 'sk-7', name: 'Tailwind CSS', slug: 'tailwind-css', category: 'Frontend' },
  { id: 'sk-8', name: 'Next.js', slug: 'next-js', category: 'Frontend' },
  { id: 'sk-9', name: 'UI/UX Design', slug: 'ui-ux-design', category: 'Diseño' },
  { id: 'sk-10', name: 'Python', slug: 'python', category: 'Backend' },
  { id: 'sk-11', name: 'Figma', slug: 'figma', category: 'Diseño' },
  { id: 'sk-12', name: 'Git & GitHub', slug: 'git-github', category: 'Herramientas' },
  { id: 'sk-13', name: 'Express.js', slug: 'express-js', category: 'Backend' },
  { id: 'sk-14', name: 'GraphQL', slug: 'graphql', category: 'Backend' },
  { id: 'sk-15', name: 'AWS Cloud', slug: 'aws-cloud', category: 'Cloud' },
  { id: 'sk-16', name: 'MongoDB', slug: 'mongodb', category: 'Base de Datos' },
  { id: 'sk-17', name: 'Prisma ORM', slug: 'prisma-orm', category: 'Base de Datos' },
  { id: 'sk-18', name: 'Arquitectura Limpia', slug: 'arquitectura-limpia', category: 'Metodología' },
  { id: 'sk-19', name: 'REST API Design', slug: 'rest-api-design', category: 'Backend' },
  { id: 'sk-20', name: 'Testing / Jest', slug: 'testing-jest', category: 'Testing' },
];

/**
 * @ruta GET /api/v1/skills
 * @descripcion Obtiene el catálogo global de habilidades técnicas de la plataforma
 * @acceso Público
 */
skillsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { name: 'asc' },
    });

    if (skills && skills.length > 0) {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        data: skills,
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: DEFAULT_SKILLS,
    });
  } catch {
    // Si la base de datos está offline o no accesible por el túnel, devolvemos el catálogo predeterminado
    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: DEFAULT_SKILLS,
    });
  }
});

