import { UserProfileDto } from './user-profile.dto.js';

/**
 * DTO de respuesta devuelto tras el registro exitoso, login o refresco de sesión.
 */
export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
  user: UserProfileDto;
}
