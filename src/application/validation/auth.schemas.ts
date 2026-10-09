import { z } from 'zod';
import { UserRole } from '../../domain/value-objects/user-role.enum.js';

/**
 * Esquema de validación para contraseñas seguras:
 * Mínimo 8 caracteres, al menos 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial.
 */
export const passwordSchema = z
  .string({ required_error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(100, 'La contraseña no puede superar los 100 caracteres')
  .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
  .regex(/[^a-zA-Z0-9]/, 'La contraseña debe contener al menos un carácter especial');

/**
 * Esquema de validación para correos electrónicos.
 */
export const emailValidationSchema = z
  .string({ required_error: 'El correo electrónico es obligatorio' })
  .trim()
  .email('El formato del correo electrónico es inválido')
  .max(255, 'El correo electrónico no puede superar los 255 caracteres');

/**
 * Esquema de validación para el registro de usuarios.
 */
export const registerSchema = z.object({
  email: emailValidationSchema,
  password: passwordSchema,
  fullName: z
    .string({ required_error: 'El nombre completo es obligatorio' })
    .trim()
    .min(2, 'El nombre completo debe tener al menos 2 caracteres')
    .max(100, 'El nombre completo no puede superar los 100 caracteres'),
  role: z.enum([UserRole.CLIENT, UserRole.FREELANCER, UserRole.ADMIN], {
    errorMap: () => ({ message: 'El rol debe ser CLIENT, FREELANCER o ADMIN' }),
  }),
});

/**
 * Esquema de validación para inicio de sesión (Login).
 */
export const loginSchema = z.object({
  email: emailValidationSchema,
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña no puede estar vacía'),
});

/**
 * Esquema de validación para renovación de token de sesión.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'El token de refresco es obligatorio' })
    .min(1, 'El token de refresco no puede estar vacío'),
});

/**
 * Esquema de validación para cierre de sesión (Logout).
 */
export const logoutSchema = z.object({
  refreshToken: z
    .string({ required_error: 'El token de refresco es obligatorio' })
    .min(1, 'El token de refresco no puede estar vacío'),
});

export type RegisterRequestDto = z.infer<typeof registerSchema>;
export type LoginRequestDto = z.infer<typeof loginSchema>;
export type RefreshTokenRequestDto = z.infer<typeof refreshTokenSchema>;
export type LogoutRequestDto = z.infer<typeof logoutSchema>;
