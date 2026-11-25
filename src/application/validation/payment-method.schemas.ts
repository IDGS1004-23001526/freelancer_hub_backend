import { z } from 'zod';

// ============================================================================
// FREEL-31 · PAY-01 — Validaciones de Métodos de Pago (PCI-DSS compliant)
// NUNCA se validan ni se aceptan números de tarjeta completos ni CVC.
// Solo se acepta el token generado por la pasarela (ej. Stripe, Openpay).
// ============================================================================

/** Marcas / franquicias permitidas */
const CARD_BRANDS = ['visa', 'mastercard', 'amex', 'discover'] as const;

/**
 * Schema para registrar un nuevo método de pago tokenizado.
 * El cliente debe primero tokenizar la tarjeta en la pasarela de pagos
 * y enviar únicamente el token resultante, nunca datos de tarjeta en claro.
 */
export const createPaymentMethodSchema = z.object({
    /** Token o ID devuelto por la pasarela (ej. Stripe pm_xxx / Openpay tok_xxx) */
    gatewayToken: z
        .string({ required_error: 'El token de pasarela es obligatorio' })
        .min(5, 'El token de pasarela no es válido')
        .max(255, 'El token de pasarela excede la longitud máxima permitida'),

    /**
     * ID del cliente en la pasarela (cus_xxx / customer_xxx).
     * Puede existir previamente o ser creado en la pasarela antes de llamar aquí.
     */
    gatewayCustomerId: z
        .string({ required_error: 'El ID de cliente en la pasarela es obligatorio' })
        .min(5, 'El ID de cliente no es válido')
        .max(255),

    /** Marca de la tarjeta (visa, mastercard, etc.) */
    cardBrand: z.enum(CARD_BRANDS, {
        required_error: 'La marca de la tarjeta es obligatoria',
        invalid_type_error: `La marca debe ser una de: ${CARD_BRANDS.join(', ')}`,
    }),

    /** Últimos 4 dígitos — solo para visualización, no datos sensibles */
    last4: z
        .string({ required_error: 'Los últimos 4 dígitos son obligatorios' })
        .regex(/^\d{4}$/, 'Los últimos 4 dígitos deben ser exactamente 4 números'),

    /** Mes de expiración (1-12) */
    expMonth: z
        .number({ required_error: 'El mes de expiración es obligatorio' })
        .int('El mes debe ser un número entero')
        .min(1, 'El mes mínimo es 1')
        .max(12, 'El mes máximo es 12'),

    /** Año de expiración (ej. 2027) */
    expYear: z
        .number({ required_error: 'El año de expiración es obligatorio' })
        .int('El año debe ser un número entero')
        .min(new Date().getFullYear(), 'La tarjeta está vencida')
        .max(new Date().getFullYear() + 20, 'El año de expiración no es válido'),

    /** Si se quiere marcar como método predeterminado */
    isDefault: z.boolean().optional().default(false),
});

export type CreatePaymentMethodDto = z.infer<typeof createPaymentMethodSchema>;
