import { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { User } from '../../../domain/entities/user.entity.js';
import { Email } from '../../../domain/value-objects/email.vo.js';
import { UserAlreadyExistsException } from '../../../domain/exceptions/domain.exception.js';
import { UserRole } from '../../../domain/value-objects/user-role.enum.js';

interface UserDatabaseRecord {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Implementación en memoria del repositorio de usuarios con simulación de índices únicos relacionales.
 */
export class InMemoryUserRepository implements IUserRepository {
  private readonly usersById = new Map<string, UserDatabaseRecord>();
  private readonly userIdsByEmail = new Map<string, string>(); // Simulación de índice único sobre email

  public async save(user: User): Promise<void> {
    const emailKey = user.email.value.toLowerCase();

    // Verificación estricta de índice único
    const idExistente = this.userIdsByEmail.get(emailKey);
    if (idExistente && idExistente !== user.id) {
      throw new UserAlreadyExistsException(user.email.value);
    }

    const registro: UserDatabaseRecord = {
      id: user.id,
      email: user.email.value,
      fullName: user.fullName,
      passwordHash: user.passwordHash,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    this.usersById.set(user.id, registro);
    this.userIdsByEmail.set(emailKey, user.id);
  }

  public async findById(id: string): Promise<User | null> {
    const registro = this.usersById.get(id);
    if (!registro) return null;
    return this.mapToDomain(registro);
  }

  public async findByEmail(email: Email): Promise<User | null> {
    const emailKey = email.value.toLowerCase();
    const userId = this.userIdsByEmail.get(emailKey);
    if (!userId) return null;

    const registro = this.usersById.get(userId);
    if (!registro) return null;

    return this.mapToDomain(registro);
  }

  public async existsByEmail(email: Email): Promise<boolean> {
    const emailKey = email.value.toLowerCase();
    return this.userIdsByEmail.has(emailKey);
  }

  public async update(user: User): Promise<void> {
    const registro = this.usersById.get(user.id);
    if (!registro) return;

    const emailAnterior = registro.email.toLowerCase();
    const emailNuevo = user.email.value.toLowerCase();

    if (emailAnterior !== emailNuevo) {
      const idExistente = this.userIdsByEmail.get(emailNuevo);
      if (idExistente && idExistente !== user.id) {
        throw new UserAlreadyExistsException(user.email.value);
      }
      this.userIdsByEmail.delete(emailAnterior);
      this.userIdsByEmail.set(emailNuevo, user.id);
    }

    this.usersById.set(user.id, {
      id: user.id,
      email: user.email.value,
      fullName: user.fullName,
      passwordHash: user.passwordHash,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  }

  /**
   * Mapea un registro de base de datos a la entidad pura de dominio.
   */
  private mapToDomain(record: UserDatabaseRecord): User {
    return new User({
      id: record.id,
      email: new Email(record.email),
      fullName: record.fullName,
      passwordHash: record.passwordHash,
      role: record.role as UserRole,
      isVerified: record.isVerified,
      isActive: record.isActive,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    });
  }
}
