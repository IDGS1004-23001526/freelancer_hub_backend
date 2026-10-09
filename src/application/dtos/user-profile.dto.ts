import { UserRole } from '../../domain/value-objects/user-role.enum.js';
import { User } from '../../domain/entities/user.entity.js';

/**
 * DTO para la transferencia de información del perfil del usuario.
 */
export interface UserProfileDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transforma una entidad User de dominio en un DTO de perfil seguro.
 */
export function toUserProfileDto(user: User): UserProfileDto {
  return {
    id: user.id,
    email: user.email.value,
    fullName: user.fullName,
    role: user.role,
    isVerified: user.isVerified,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
