import bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../../application/interfaces/password-hasher.interface.js';

/**
 * Implementación del servicio de cifrado de contraseñas usando BCrypt con salt integrado.
 */
export class BcryptPasswordHasher implements IPasswordHasher {
  private readonly saltRounds: number;

  constructor(saltRounds = 12) {
    this.saltRounds = saltRounds;
  }

  public async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return bcrypt.hash(password, salt);
  }

  public async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
