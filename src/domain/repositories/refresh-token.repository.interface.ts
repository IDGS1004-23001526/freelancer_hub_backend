import { RefreshToken } from '../entities/refresh-token.entity.js';

/**
 * Contrato del Repositorio de Tokens de Refresco de Sesión.
 */
export interface IRefreshTokenRepository {
  /**
   * Guarda un token de refresco en la persistencia.
   */
  save(token: RefreshToken): Promise<void>;

  /**
   * Busca un token de refresco por su hash SHA-256.
   */
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;

  /**
   * Revoca un token de refresco específico por su hash.
   */
  revokeByTokenHash(tokenHash: string): Promise<void>;

  /**
   * Revoca todas las sesiones activas asociadas a un identificador de usuario.
   */
  revokeAllByUserId(userId: string): Promise<void>;

  /**
   * Elimina tokens expirados o revocados para depuración de base de datos.
   */
  deleteExpired(): Promise<number>;
}
