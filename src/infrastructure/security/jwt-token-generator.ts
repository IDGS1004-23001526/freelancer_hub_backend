import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  IJwtTokenGenerator,
  JwtUserClaims,
} from '../../application/interfaces/jwt-token-generator.interface.js';
import { InvalidTokenException } from '../../domain/exceptions/domain.exception.js';
import { env } from '../../config/env.js';

/**
 * Implementación de generación y verificación de tokens JWT firmados con algoritmo HMAC-SHA256 (HS256).
 */
export class JwtTokenGenerator implements IJwtTokenGenerator {
  private readonly accessSecret: string;
  private readonly refreshExpirationDays: number;
  private readonly accessExpiration: string;

  constructor() {
    this.accessSecret = env.JWT_ACCESS_SECRET;
    this.accessExpiration = env.JWT_ACCESS_EXPIRATION;
    this.refreshExpirationDays = env.JWT_REFRESH_EXPIRATION_DAYS;
  }

  /**
   * Genera un Access Token JWT con tiempo de vida corto (15 min).
   */
  public generateAccessToken(claims: JwtUserClaims): string {
    return jwt.sign(
      {
        email: claims.email,
        role: claims.role,
        isVerified: claims.isVerified,
      },
      this.accessSecret,
      {
        subject: claims.sub,
        expiresIn: this.accessExpiration as any,
        algorithm: 'HS256',
      }
    );
  }

  /**
   * Genera un Refresh Token criptográficamente aleatorio y calcula su hash SHA-256.
   */
  public generateRefreshToken(): { rawToken: string; tokenHash: string; expiresAt: Date } {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashRefreshToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshExpirationDays);

    return { rawToken, tokenHash, expiresAt };
  }

  /**
   * Valida la firma del token JWT y extrae los claims del usuario.
   */
  public verifyAccessToken(token: string): JwtUserClaims {
    try {
      const decoded = jwt.verify(token, this.accessSecret, {
        algorithms: ['HS256'],
      }) as jwt.JwtPayload;

      if (!decoded.sub || !decoded.email || !decoded.role) {
        throw new InvalidTokenException('El payload del token no contiene los claims requeridos.');
      }

      return {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        isVerified: Boolean(decoded.isVerified),
      };
    } catch (error) {
      if (error instanceof InvalidTokenException) {
        throw error;
      }
      throw new InvalidTokenException('Token de acceso inválido, expirado o manipulado.');
    }
  }

  /**
   * Genera el hash SHA-256 a partir de la cadena en texto plano del refresh token.
   */
  public hashRefreshToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }
}
