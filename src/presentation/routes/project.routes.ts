import { Router } from 'express';
import { Container } from '../../container.js';
import { validateBody } from '../middlewares/validate-request.middleware.js';
import { createProjectSchema } from '../../application/validation/project.schemas.js';

export const projectRouter = Router();

/**
 * @ruta POST /api/v1/projects
 * @descripcion Crea una nueva convocatoria de proyecto
 * @acceso Protegido (Bearer, rol CLIENT)
 */

projectRouter.post(
    '/',
    Container.authMiddleware,
    validateBody(createProjectSchema),
    Container.projectController.create
);