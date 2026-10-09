import { UserRole } from '../../domain/value-objects/user-role.enum.js';

/**
 * Claims contenidos dentro del payload del Access Token JWT.
 */
export interface JwtUserClaims {
  sub: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

/**
 * Conjunto de tokens emitidos al iniciar o renovar una sesión.
 */
export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
  expiresAt: Date;
}

/**
 * Contrato para el generador y verificador de tokens de acceso y refresco.
 */
export interface IJwtTokenGenerator {
  /**
   * Genera y firma un Access Token JWT con tiempo de vida corto (15 min).
   */
  generateAccessToken(claims: JwtUserClaims): string;

  /**
   * Genera un Refresh Token criptográficamente seguro, su hash SHA-256 y fecha de vencimiento.
   */
  generateRefreshToken(): { rawToken: string; tokenHash: string; expiresAt: Date };

  /**
   * Verifica la validez y firma de un Access Token y extrae sus claims.
   */
  verifyAccessToken(token: string): JwtUserClaims;

  /**
   * Genera un hash SHA-256 determinista a partir de un token de refresco en texto plano.
   */
  hashRefreshToken(rawToken: string): string;
}
