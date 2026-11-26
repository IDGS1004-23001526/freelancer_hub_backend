import { Router } from 'express';
import { Container } from '../../container.js';
import { validateBody } from '../middlewares/validate-request.middleware.js';
import {
    depositWalletSchema,
    withdrawWalletSchema,
    creditEscrowSchema,
} from '../../application/validation/escrow-wallet.schemas.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { UserRole } from '../../domain/value-objects/user-role.enum.js';

export const walletRouter = Router();

/**
 * @ruta GET /api/v1/wallet
 * @descripcion Consulta balance disponible, balance retenido en Escrow e historial de transacciones
 */
walletRouter.get(
    '/',
    Container.authMiddleware,
    Container.walletController.getWallet
);

/**
 * @ruta POST /api/v1/wallet/deposit
 * @descripcion Abona saldo a la billetera digital del usuario
 */
walletRouter.post(
    '/deposit',
    Container.authMiddleware,
    validateBody(depositWalletSchema),
    Container.walletController.deposit
);

/**
 * @ruta POST /api/v1/wallet/withdraw
 * @descripcion Procesa orden de retiro SPEI a cuenta CLABE de 18 dígitos
 */
walletRouter.post(
    '/withdraw',
    Container.authMiddleware,
    validateBody(withdrawWalletSchema),
    Container.walletController.withdraw
);

/**
 * @ruta POST /api/v1/wallet/credit-escrow
 * @descripcion Acredita pago liberado al freelancer descontando automáticamente el 10% Service Fee
 */
walletRouter.post(
    '/credit-escrow',
    Container.authMiddleware,
    // Acredita dinero a terceros: operación interna, nunca expuesta a clientes ni freelancers.
    roleGuard([UserRole.ADMIN]),
    validateBody(creditEscrowSchema),
    Container.walletController.creditEscrow
);
