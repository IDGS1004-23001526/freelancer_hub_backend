import { Request, Response, NextFunction } from 'express';
import { PaymentMethodUseCase } from '../../application/use-cases/payment-method.use-case.js';
import { InvalidTokenException } from '../../domain/exceptions/domain.exception.js';
import { Container } from '../../container.js';

// ============================================================================
// FREEL-31 · PAY-01 — Controller: Métodos de Pago (PCI-DSS compliant)
// ============================================================================

export class PaymentMethodController {
    constructor(private readonly paymentMethodUseCase: PaymentMethodUseCase) {}

    /**
     * POST /api/v1/payment-methods
     * Registra un nuevo método de pago tokenizado para el usuario autenticado.
     * El body debe contener SOLO el token de la pasarela, nunca datos de tarjeta en claro.
     */
    public add = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const result = await this.paymentMethodUseCase.addPaymentMethod(claims.sub, req.body);

            Container.logger.info('Método de pago tokenizado registrado', {
                context:          'PAYMENT_METHOD',
                action:           'ADD_PAYMENT_METHOD',
                statusCode:       201,
                userId:           claims.sub,
                paymentMethodId:  result.id,
                cardBrand:        result.cardBrand,
                last4:            result.last4,
            });

            res.status(201).json({
                success:    true,
                statusCode: 201,
                message:    'Método de pago registrado exitosamente.',
                data:       result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /api/v1/payment-methods
     * Retorna los métodos de pago del usuario autenticado.
     * Respuesta sanitizada — sin tokens ni datos sensibles (PCI-DSS).
     */
    public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const result = await this.paymentMethodUseCase.getPaymentMethods(claims.sub);

            Container.logger.info('Métodos de pago consultados', {
                context:    'PAYMENT_METHOD',
                action:     'GET_PAYMENT_METHODS',
                statusCode: 200,
                userId:     claims.sub,
                total:      result.length,
            });

            res.status(200).json({
                success:    true,
                statusCode: 200,
                data:       result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * DELETE /api/v1/payment-methods/:id
     * Desvincula un método de pago. Solo el propietario puede eliminarlo.
     */
    public remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const id = String(req.params['id']);

            const result = await this.paymentMethodUseCase.deletePaymentMethod(claims.sub, id);

            Container.logger.info('Método de pago eliminado', {
                context:         'PAYMENT_METHOD',
                action:          'DELETE_PAYMENT_METHOD',
                statusCode:      200,
                userId:          claims.sub,
                paymentMethodId: id,
            });

            res.status(200).json({
                success:    true,
                statusCode: 200,
                message:    'Método de pago eliminado correctamente.',
                data:       result,
            });
        } catch (error) {
            next(error);
        }
    };
}
