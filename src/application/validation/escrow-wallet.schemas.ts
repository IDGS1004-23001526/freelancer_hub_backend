import { z } from 'zod';

export const createContractSchema = z.object({
    proposalId: z
        .string({ required_error: 'El ID de la propuesta es obligatorio' })
        .uuid('El ID de la propuesta debe ser un UUID válido'),
});

export const updateContractStatusSchema = z.object({
    status: z.enum(['FUNDED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED'], {
        required_error: 'El nuevo estado es obligatorio',
    }),
});

export const depositWalletSchema = z.object({
    amount: z
        .number({ required_error: 'El monto a depositar es obligatorio' })
        .positive('El monto debe ser mayor a 0')
        .max(99999999.99, 'El monto excede el límite permitido'),
    description: z.string().max(255).optional().default('Abono de fondos a billetera digital'),
});

export const withdrawWalletSchema = z.object({
    amount: z
        .number({ required_error: 'El monto a retirar es obligatorio' })
        .positive('El monto a retirar debe ser mayor a 0')
        .max(99999999.99, 'El monto excede el límite permitido'),
    clabeAccount: z
        .string({ required_error: 'La cuenta CLABE interbancaria es obligatoria' })
        .regex(/^\d{18}$/, 'La cuenta CLABE debe contener exactamente 18 dígitos numéricos'),
});

export const creditEscrowSchema = z.object({
    freelancerId: z.string().uuid('ID de freelancer inválido'),
    grossAmount: z.number().positive('El monto bruto debe ser mayor a 0'),
    contractId: z.string().uuid('ID de contrato inválido').optional(),
    description: z.string().max(255).optional().default('Liberación de pago por hito aprobado'),
});

export type CreateContractDto = z.infer<typeof createContractSchema>;
export type UpdateContractStatusDto = z.infer<typeof updateContractStatusSchema>;
export type DepositWalletDto = z.infer<typeof depositWalletSchema>;
export type WithdrawWalletDto = z.infer<typeof withdrawWalletSchema>;
export type CreditEscrowDto = z.infer<typeof creditEscrowSchema>;
