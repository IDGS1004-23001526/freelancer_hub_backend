import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import { CreatePaymentMethodDto } from '../validation/payment-method.schemas.js';
import {
    PaymentMethodNotFoundException,
    PaymentMethodForbiddenException,
} from '../../domain/exceptions/domain.exception.js';

// ============================================================================
// FREEL-31 · PAY-01 — Use Case: Gestión de Métodos de Pago (PCI-DSS)
// ============================================================================
// IMPORTANTE - CUMPLIMIENTO PCI-DSS:
//   ✅ Se almacena ÚNICAMENTE el token devuelto por la pasarela de pagos.
//   ✅ Se guardan últimos 4 dígitos (safe display), marca y fecha de expiración.
//   ❌ NUNCA se persiste el número de tarjeta completo (PAN).
//   ❌ NUNCA se persiste el código de seguridad (CVC/CVV/CVC2).
//   ❌ NUNCA se persiste el PIN ni ningún dato de autenticación de tarjeta.
// ============================================================================

export class PaymentMethodUseCase {

    /**
     * Registra un nuevo método de pago tokenizado para el usuario autenticado.
     * Si isDefault=true se quita la marca de predeterminado de los demás métodos.
     */
    async addPaymentMethod(userId: string, dto: CreatePaymentMethodDto) {
        // Si se quiere marcar como predeterminado, primero desmarcamos los otros
        if (dto.isDefault) {
            await prisma.paymentMethod.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        }

        const created = await prisma.paymentMethod.create({
            data: {
                userId,
                gatewayToken:      dto.gatewayToken,
                gatewayCustomerId: dto.gatewayCustomerId,
                cardBrand:         dto.cardBrand,
                last4:             dto.last4,
                expMonth:          dto.expMonth,
                expYear:           dto.expYear,
                isDefault:         dto.isDefault ?? false,
            },
            // Proyección sanitizada — el token de pasarela no se devuelve al cliente
            select: {
                id:        true,
                cardBrand: true,
                last4:     true,
                expMonth:  true,
                expYear:   true,
                isDefault: true,
                createdAt: true,
            },
        });

        return created;
    }

    /**
     * Retorna todos los métodos de pago del usuario autenticado.
     * Los datos son 100% sanitizados: sin tokens, sin datos sensibles.
     */
    async getPaymentMethods(userId: string) {
        const methods = await prisma.paymentMethod.findMany({
            where: { userId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
            select: {
                id:        true,
                cardBrand: true,
                last4:     true,
                expMonth:  true,
                expYear:   true,
                isDefault: true,
                createdAt: true,
            },
        });

        return methods;
    }

    /**
     * Elimina (desvincula) un método de pago del usuario autenticado.
     * Solo el propietario puede eliminarlo — se valida ownership antes de borrar.
     */
    async deletePaymentMethod(userId: string, paymentMethodId: string) {
        // 1. Verificar que el método existe
        const existing = await prisma.paymentMethod.findUnique({
            where: { id: paymentMethodId },
            select: { id: true, userId: true },
        });

        if (!existing) {
            throw new PaymentMethodNotFoundException(paymentMethodId);
        }

        // 2. Verificar que pertenece al usuario autenticado (ownership check PCI-DSS)
        if (existing.userId !== userId) {
            throw new PaymentMethodForbiddenException();
        }

        // 3. Eliminar el registro
        await prisma.paymentMethod.delete({ where: { id: paymentMethodId } });

        return { deleted: true, id: paymentMethodId };
    }
}
