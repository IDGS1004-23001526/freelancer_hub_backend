import { Router } from 'express';
import { Container } from '../../container.js';
import { validateBody } from '../middlewares/validate-request.middleware.js';
import { createProposalSchema } from '../../application/validation/proposal.schemas.js';
import { createRateLimitMiddleware } from '../middlewares/rate-limit.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { UserRole } from '../../domain/value-objects/user-role.enum.js';

export const proposalRouter = Router();

const submitProposalRateLimit = createRateLimitMiddleware({
    maxRequests: 30,
    windowMs: 60 * 60 * 1000, // 1 hora
    keyPrefix: 'submit-proposal',
    message: 'Has alcanzado el límite máximo de propuestas enviadas por hora.',
});

/**
 * @ruta POST /api/v1/proposals
 * @descripcion Registra una nueva propuesta económica por hitos
 * @acceso Protegido (Bearer, rol FREELANCER)
 */
proposalRouter.post(
    '/',
    Container.authMiddleware,
    roleGuard([UserRole.FREELANCER]),
    submitProposalRateLimit,
    validateBody(createProposalSchema),
    Container.proposalController.submit
);

/**
 * @ruta GET /api/v1/proposals/me
 * @descripcion Consulta todas las postulaciones del freelancer autenticado
 * @acceso Protegido (Bearer, rol FREELANCER)
 */
proposalRouter.get(
    '/me',
    Container.authMiddleware,
    roleGuard([UserRole.FREELANCER]),
    Container.proposalController.getMine
);

/**
 * @ruta GET /api/v1/proposals/project/:projectId
 * @descripcion Consulta las propuestas recibidas para una convocatoria (solo cliente dueño o ADMIN)
 * @acceso Protegido (Bearer, rol CLIENT o ADMIN)
 */
proposalRouter.get(
    '/project/:projectId',
    Container.authMiddleware,
    roleGuard([UserRole.CLIENT, UserRole.ADMIN]),
    Container.proposalController.getByProject
);
