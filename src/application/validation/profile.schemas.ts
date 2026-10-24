import { z } from 'zod';

export const updateProfessionalInfoSchema = z.object({
  professionalTitle: z
    .string({ required_error: 'El título profesional es obligatorio' })
    .trim()
    .min(3, 'El título profesional debe tener al menos 3 caracteres')
    .max(100, 'El título profesional no puede superar los 100 caracteres'),
  bio: z
    .string()
    .trim()
    .max(1000, 'La biografía no puede superar los 1000 caracteres')
    .optional()
    .default(''),
  hourlyRate: z
    .number({ required_error: 'La tarifa por hora es obligatoria' })
    .min(1, 'La tarifa por hora debe ser de al menos $1 USD')
    .max(10000, 'La tarifa por hora no puede exceder $10,000 USD')
    .optional()
    .default(25),
});

export const portfolioItemSchema = z.object({
  title: z
    .string({ required_error: 'El título del proyecto es obligatorio' })
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(150, 'El título no puede superar los 150 caracteres'),
  description: z
    .string({ required_error: 'La descripción del proyecto es obligatoria' })
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'La descripción no puede superar los 1000 caracteres'),
  projectUrl: z
    .string({ required_error: 'La URL del proyecto es obligatoria' })
    .trim()
    .url('Debe ser una URL válida (ej. https://...)'),
  imageUrl: z.string().trim().url('Debe ser una URL válida de imagen').nullable().optional(),
});

export const updateSkillsSchema = z.object({
  skills: z
    .array(z.string().trim().min(1, 'La habilidad no puede estar vacía'))
    .min(1, 'Debes seleccionar al menos una habilidad')
    .max(30, 'No puedes agregar más de 30 habilidades'),
});

export type UpdateProfessionalInfoRequestDto = z.infer<typeof updateProfessionalInfoSchema>;
export type PortfolioItemRequestDto = z.infer<typeof portfolioItemSchema>;
export type UpdateSkillsRequestDto = z.infer<typeof updateSkillsSchema>;
