import { z } from 'zod';
import { UserRole } from '../../domain/value-objects/user-role.enum.js';

/**
 * Expresión regular estricta de contraseña según lineamientos OWASP:
 * - Mínimo 8 caracteres y máximo 100 (sin espacios en blanco ni caracteres de control)
 * - Al menos 1 letra (mayúscula o minúscula: [A-Za-z])
 * - Al menos 1 número (\d)
 */
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)\S{8,100}$/;

/**
 * Función de sanitización de texto para prevenir inyecciones XSS, HTML y caracteres de control.
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/[\x00-\x1F\x7F]/g, '') // Elimina caracteres de control y bytes nulos
    .replace(/<[^>]*>?/gm, '') // Elimina etiquetas HTML/Script (prevención XSS)
    .replace(/[<>'"`;$]/g, '') // Elimina delimitadores comunes de inyección SQL/NoSQL/XSS
    .trim()
    .replace(/\s+/g, ' '); // Normaliza espacios múltiples
}

/**
 * Esquema de validación para contraseñas seguras:
 * Mínimo 8 caracteres, al menos 1 letra y al menos 1 número.
 */
export const passwordSchema = z
  .string({ required_error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(100, 'La contraseña no puede superar los 100 caracteres')
  .regex(/[A-Za-z]/, 'La contraseña debe contener al menos una letra')
  .regex(/\d/, 'La contraseña debe contener al menos un número')
  .regex(
    PASSWORD_REGEX,
    'La contraseña debe tener mínimo 8 caracteres, al menos 1 letra, al menos 1 número y sin espacios'
  );

/**
 * Esquema de validación y sanitización para correos electrónicos.
 */
export const emailValidationSchema = z
  .string({ required_error: 'El correo electrónico es obligatorio' })
  .trim()
  .toLowerCase()
  .email('El formato del correo electrónico es inválido')
  .max(255, 'El correo electrónico no puede superar los 255 caracteres')
  .refine((val) => !/[\x00-\x1F\x7F<>'"`;]/.test(val), {
    message: 'El correo electrónico contiene caracteres no permitidos',
  });

/**
 * Esquema de validación y sanitización para el DTO de registro de usuarios.
 */
export const registerSchema = z
  .object({
    email: emailValidationSchema,
    password: passwordSchema,
    fullName: z
      .string({ required_error: 'El nombre completo es obligatorio' })
      .transform(sanitizeString)
      .pipe(
        z
          .string()
          .min(2, 'El nombre completo debe tener al menos 2 caracteres válidos')
          .max(100, 'El nombre completo no puede superar los 100 caracteres')
      ),
    role: z
      .enum([UserRole.CLIENT, UserRole.FREELANCER, UserRole.ADMIN], {
        errorMap: () => ({ message: 'El rol debe ser CLIENT, FREELANCER o ADMIN' }),
      })
      .default(UserRole.FREELANCER),
  })
  .strict();

/**
 * Esquema de validación para inicio de sesión (Login).
 */
export const loginSchema = z
  .object({
    email: emailValidationSchema,
    password: z
      .string({ required_error: 'La contraseña es obligatoria' })
      .min(1, 'La contraseña no puede estar vacía')
      .max(100, 'La contraseña excede la longitud máxima permitida'),
  })
  .strict();

/**
 * Esquema de validación para renovación de token de sesión.
 */
export const refreshTokenSchema = z
  .object({
    refreshToken: z
      .string({ required_error: 'El token de refresco es obligatorio' })
      .trim()
      .min(1, 'El token de refresco no puede estar vacío'),
  })
  .strict();

/**
 * Esquema de validación para cierre de sesión (Logout).
 */
export const logoutSchema = z
  .object({
    refreshToken: z
      .string({ required_error: 'El token de refresco es obligatorio' })
      .trim()
      .min(1, 'El token de refresco no puede estar vacío'),
  })
  .strict();

export type RegisterRequestDto = z.infer<typeof registerSchema>;
export type LoginRequestDto = z.infer<typeof loginSchema>;
export type RefreshTokenRequestDto = z.infer<typeof refreshTokenSchema>;
export type LogoutRequestDto = z.infer<typeof logoutSchema>;
