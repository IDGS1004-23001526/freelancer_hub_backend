import { Router } from 'express';
import { Container } from '../../container.js';
import { validateBody } from '../middlewares/validate-request.middleware.js';
import { createPaymentMethodSchema } from '../../application/validation/payment-method.schemas.js';

// ============================================================================
// FREEL-31 · PAY-01 — Rutas: API de Métodos de Pago (PCI-DSS compliant)
// Base: /api/v1/payment-methods
// Todas las rutas requieren autenticación JWT (authMiddleware).
// ============================================================================

export const paymentMethodRouter = Router();

/**
 * @route  POST /api/v1/payment-methods
 * @desc   Registra un nuevo método de pago tokenizado.
 *         El cuerpo debe contener el token de la pasarela, NUNCA datos en claro.
 * @access Privado — solo el usuario autenticado
 */
paymentMethodRouter.post(
    '/',
    Container.authMiddleware,
    validateBody(createPaymentMethodSchema),
    Container.paymentMethodController.add
);

/**
 * @route  GET /api/v1/payment-methods
 * @desc   Lista los métodos de pago registrados del usuario autenticado.
 *         Respuesta 100% sanitizada — sin tokens ni datos sensibles.
 * @access Privado — solo el usuario autenticado
 */
paymentMethodRouter.get(
    '/',
    Container.authMiddleware,
    Container.paymentMethodController.list
);

/**
 * @route  DELETE /api/v1/payment-methods/:id
 * @desc   Desvincula un método de pago. Solo el propietario puede eliminarlo.
 * @access Privado — solo el usuario autenticado y propietario del método
 */
paymentMethodRouter.delete(
    '/:id',
    Container.authMiddleware,
    Container.paymentMethodController.remove
);

paymentMethodRouter.patch(
    '/:id/default',
    Container.authMiddleware,
    Container.paymentMethodController.setDefault
);
