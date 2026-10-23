import bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../../application/interfaces/password-hasher.interface.js';

const MIN_OWASP_SALT_ROUNDS = 10;
const DEFAULT_SALT_ROUNDS = 12;

/**
 * Implementación del servicio de cifrado unidireccional de contraseñas usando BCrypt.
 * Cumple con OWASP Password Storage Cheat Sheet (cost factor / salt rounds >= 10).
 */
export class BcryptPasswordHasher implements IPasswordHasher {
  private readonly saltRounds: number;

  constructor(saltRounds: number = DEFAULT_SALT_ROUNDS) {
    if (!Number.isInteger(saltRounds) || saltRounds < MIN_OWASP_SALT_ROUNDS) {
      throw new Error(
        `Configuración de seguridad inválida: saltRounds debe ser un entero >= ${MIN_OWASP_SALT_ROUNDS} según lineamientos OWASP.`
      );
    }
    this.saltRounds = saltRounds;
  }

  public get costFactor(): number {
    return this.saltRounds;
  }

  public async hash(password: string): Promise<string> {
    if (!password || typeof password !== 'string' || password.length === 0) {
      throw new Error('No se puede generar hash de una contraseña vacía.');
    }
    const salt = await bcrypt.genSalt(this.saltRounds);
    return bcrypt.hash(password, salt);
  }

  public async compare(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }
    return bcrypt.compare(password, hash);
  }
}

/**
 * Redacta campos sensibles (como password, passwordHash, token, refreshToken) de cualquier
 * objeto antes de enviarlo a logs o trazas de auditoría.
 */
export function redactSensitiveData<T extends Record<string, unknown>>(payload: T): Record<string, unknown> {
  const sensitiveKeys = new Set([
    'password',
    'passwordhash',
    'currentpassword',
    'newpassword',
    'refreshtoken',
    'accesstoken',
    'token',
    'secret',
  ]);

  const clone: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (sensitiveKeys.has(key.toLowerCase())) {
      clone[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      clone[key] = redactSensitiveData(value as Record<string, unknown>);
    } else {
      clone[key] = value;
    }
  }
  return clone;
}
