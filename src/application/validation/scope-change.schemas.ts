import { z } from 'zod';

export const createChangeRequestSchema = z.object({
    title: z
        .string({ required_error: 'El título de la adenda es obligatorio' })
        .trim()
        .min(5, 'El título debe tener al menos 5 caracteres')
        .max(150, 'El título no puede superar los 150 caracteres'),
    description: z
        .string({ required_error: 'La justificación del cambio es obligatoria' })
        .trim()
        .min(15, 'La descripción debe tener al menos 15 caracteres')
        .max(3000, 'La descripción no puede superar los 3000 caracteres'),
    complexityFactor: z
        .number()
        .min(0.5, 'El factor mínimo de complejidad es 0.5')
        .max(3.0, 'El factor máximo de complejidad es 3.0')
        .optional()
        .default(1.0),
    addedDeliverables: z
        .array(
            z.object({
                title: z
                    .string({ required_error: 'El nombre del entregable es obligatorio' })
                    .trim()
                    .min(3, 'El entregable debe tener al menos 3 caracteres')
                    .max(150),
                description: z.string().trim().max(1000).optional(),
                estimatedDays: z.number().int().positive().max(365).optional(),
            })
        )
        .min(1, 'Debe agregar al menos 1 entregable nuevo'),
});

export const signChangeRequestSchema = z.object({
    confirmed: z.literal(true, {
        errorMap: () => ({ message: 'Debes confirmar explícitamente la adenda (confirmed: true).' }),
    }),
});

export type CreateChangeRequestDto = z.infer<typeof createChangeRequestSchema>;
export type SignChangeRequestDto = z.infer<typeof signChangeRequestSchema>;