import { z } from 'zod';
import { sanitizeXss } from '../../domain/entities/project.entity.js';

export const createProjectSchema = z.object({
    title: z
        .string({ required_error: 'El título es obligatorio' })
        .transform(sanitizeXss)
        .pipe(
            z.string()
                .min(10, 'El titulo debe tener al menos 10 caracteres')
                .max(150, 'El título no puede superar los 150 caracteres')
        ),
    description: z
        .string({ required_error: 'La descripción es obligatoria' })
        .transform(sanitizeXss)
        .pipe(
            z.string()
                .min(30, 'La descripción debe tener al menos 30 caracteres')
                .max(5000, 'La descripción no puede superar los 5000 caracteres')
        ),
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

export const getProjectsQuerySchema = z.object({
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    minBudget: z.coerce.number().min(0, 'El presupuesto mínimo no puede ser negativo').optional(),
    maxBudget: z.coerce.number().positive('El presupuesto máximo debe ser mayor a 0').optional(),
    skills: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform((val) => {
            if (!val) return undefined;
            if (Array.isArray(val)) {
                return val
                    .flatMap((s) => s.split(','))
                    .map((s) => s.trim())
                    .filter(Boolean);
            }
            return val
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        }),
    page: z.coerce.number().int().min(1, 'La página mínima es 1').default(1),
    limit: z.coerce.number().int().min(1, 'El límite mínimo es 1').max(50, 'El límite máximo es 50').default(10),
});

export type GetProjectsQueryDto = z.infer<typeof getProjectsQuerySchema>;