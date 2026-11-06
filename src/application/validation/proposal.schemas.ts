import { z } from 'zod';
import { sanitizeXss } from '../../domain/entities/project.entity.js';

export const createMilestoneQuoteSchema = z.object({
    title: z
        .string({ required_error: 'El título del hito es obligatorio' })
        .transform(sanitizeXss)
        .pipe(
            z.string()
                .min(5, 'El título del hito debe tener al menos 5 caracteres')
                .max(150, 'El título del hito no puede superar los 150 caracteres')
        ),
    description: z
        .string()
        .optional()
        .transform((val) => (val ? sanitizeXss(val) : val)),
    amount: z
        .number({ required_error: 'El monto del hito es obligatorio', invalid_type_error: 'El monto debe ser numérico' })
        .positive('El monto del hito debe ser mayor a 0')
        .max(99999999.99, 'El monto del hito excede el límite permitido'),
    deliveryDays: z
        .number({ required_error: 'Los días estimados de entrega son obligatorios' })
        .int('Los días deben ser un número entero')
        .positive('Los días estimados deben ser mayores a 0')
        .max(365, 'Los días estimados no pueden exceder 365 días'),
    order: z
        .number()
        .int()
        .positive()
        .optional()
        .default(1),
});

export const createProposalSchema = z.object({
    projectId: z
        .string({ required_error: 'El ID de la convocatoria es obligatorio' })
        .uuid('El ID de la convocatoria debe tener formato UUID válido'),
    coverLetter: z
        .string({ required_error: 'La carta de presentación es obligatoria' })
        .transform(sanitizeXss)
        .pipe(
            z.string()
                .min(20, 'La carta de presentación debe tener al menos 20 caracteres')
                .max(5000, 'La carta de presentación no puede superar los 5000 caracteres')
        ),
    totalPrice: z
        .number({ required_error: 'El precio total es obligatorio', invalid_type_error: 'El precio debe ser numérico' })
        .positive('El precio total debe ser mayor a 0')
        .max(99999999.99, 'El precio total excede el límite permitido'),
    estimatedDays: z
        .number({ required_error: 'Los días estimados totales son obligatorios' })
        .int('Los días totales deben ser un número entero')
        .positive('Los días estimados deben ser mayores a 0')
        .max(365, 'Los días estimados no pueden superar 365 días'),
    milestones: z
        .array(createMilestoneQuoteSchema, {
            required_error: 'Debes definir al menos un hito en tu propuesta',
        })
        .min(1, 'La propuesta debe tener al menos un hito de entrega'),
});

export type CreateMilestoneQuoteDto = z.infer<typeof createMilestoneQuoteSchema>;
export type CreateProposalDto = z.infer<typeof createProposalSchema>;
