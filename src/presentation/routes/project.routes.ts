import { Router } from 'express';
import { Container } from '../../container.js';
import { validateBody, validateQuery } from '../middlewares/validate-request.middleware.js';
import { createProjectSchema, getProjectsQuerySchema } from '../../application/validation/project.schemas.js';
import { createRateLimitMiddleware } from '../middlewares/rate-limit.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { UserRole } from '../../domain/value-objects/user-role.enum.js';

export const projectRouter = Router();

/**
 * @ruta GET /api/v1/projects
 * @descripcion Consulta y filtra convocatorias activas para el feed
 * @acceso Público
 */
projectRouter.get(
    '/',
    validateQuery(getProjectsQuerySchema),
    Container.projectController.getProjects
);

/**
 * @ruta GET /api/v1/projects/:id
 * @descripcion Consulta el detalle de una convocatoria individual
 * @acceso Público
 */
projectRouter.get(
    '/:id',
    Container.projectController.getById
);

const createProjectRateLimit = createRateLimitMiddleware({
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hora
    keyPrefix: 'create-project',
    message: 'Has alcanzado el límite máximo de 10 convocatorias creadas por hora.',
});

/**
 * @ruta POST /api/v1/projects
 * @descripcion Crea una nueva convocatoria de proyecto
 * @acceso Protegido (Bearer, rol CLIENT)
 */
projectRouter.post(
    '/',
    Container.authMiddleware,
    roleGuard([UserRole.CLIENT]),
    createProjectRateLimit,
    validateBody(createProjectSchema),
    Container.projectController.create
);

