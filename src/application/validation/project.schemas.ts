import { z } from 'zod';

export const createProjectSchema = z.object({
    title: z
        .string({ required_error: 'El título es obligatorio' })
        .trim()
        .min(10, 'El título debe tener al menos 10 caracteres')
        .max(150, 'El título no puede superar los 150 caracteres'),
    description: z
        .string({ required_error: 'La descripción es obligatoria' })
        .trim()
        .min(30, 'La descripción debe tener al menos 30 caracteres')
        .max(5000, 'La descripción no puede superar los 5000 caracteres'),
    budget: z
        .number({ required_error: 'El presupuesto es obligatorio', invalid_type_error: 'El presupuesto debe ser numérico' })
        .positive('El presupuesto debe ser mayor a 0')
        .max(99999999.99, 'El presupuesto excede el máximo permitido'),
    skills: z
        .array(z.string().trim().min(1, 'Los tags no pueden estar vacíos').max(100), {
            required_error: 'Los tags de habilidades son obligatorios',
        })
        .min(3, 'Se requieren al menos 3 tags de habilidades'),
    estimatedDate: z
        .string({ required_error: 'La fecha estimada es obligatoria' })
        .datetime({ offset: true, message: 'La fecha estimada debe tener formato ISO 8601' }),
});

export type CreateProjectRequestDto = z.infer<typeof createProjectSchema>;