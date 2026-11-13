import { Router } from 'express';
import { Container } from '../../container.js';
import { validateBody } from '../middlewares/validate-request.middleware.js';
import { createContractSchema } from '../../application/validation/escrow-wallet.schemas.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { UserRole } from '../../domain/value-objects/user-role.enum.js';

export const contractRouter = Router();

/**
 * @ruta GET /api/v1/contracts
 * @descripcion Lista los contratos activos del usuario (Cliente o Freelancer)
 */
contractRouter.get(
    '/',
    Container.authMiddleware,
    Container.contractController.listMine
);

/**
 * @ruta GET /api/v1/contracts/:id
 * @descripcion Obtiene el detalle de un contrato y sus hitos
 */
contractRouter.get(
    '/:id',
    Container.authMiddleware,
    Container.contractController.getById
);

/**
 * @ruta POST /api/v1/contracts
 * @descripcion Crea un contrato formal en estado DRAFT al aceptar una propuesta
 * @acceso Protegido (Rol CLIENT)
 */
contractRouter.post(
    '/',
    Container.authMiddleware,
    roleGuard([UserRole.CLIENT]),
    validateBody(createContractSchema),
    Container.contractController.create
);

/**
 * @ruta POST /api/v1/contracts/:id/fund
 * @descripcion Retiene el saldo del cliente en custodia Escrow (DRAFT -> FUNDED)
 * @acceso Protegido (Rol CLIENT)
 */
contractRouter.post(
    '/:id/fund',
    Container.authMiddleware,
    roleGuard([UserRole.CLIENT]),
    Container.contractController.fund
);

/**
 * @ruta POST /api/v1/contracts/:id/progress
 * @descripcion Avanza el estado del contrato (FUNDED -> IN_PROGRESS). Bloquea si no está fondeado.
 */
contractRouter.post(
    '/:id/progress',
    Container.authMiddleware,
    Container.contractController.advanceProgress
);
