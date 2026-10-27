import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { User } from '../../../domain/entities/user.entity.js';
import { Email } from '../../../domain/value-objects/email.vo.js';
import { UserRole } from '../../../domain/value-objects/user-role.enum.js';
import { UserAlreadyExistsException } from '../../../domain/exceptions/domain.exception.js';

/**
 * Implementación concreta del repositorio de usuarios con Prisma ORM y PostgreSQL.
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async save(user: User): Promise<void> {
    const emailKey = user.email.value.toLowerCase();

    // Verificación de existencia previa
    const existing = await this.prisma.user.findUnique({
      where: { email: emailKey },
    });

    if (existing) {
      throw new UserAlreadyExistsException(user.email.value);
    }

    // Dividimos el fullName en firstName y lastName para el perfil inicial
    const parts = user.fullName.trim().split(/\s+/);
    const firstName = parts[0] || 'Usuario';
    const lastName = parts.slice(1).join(' ') || '';

    // Transacción atómica: se crea el User y su Profile inicial en un solo paso
    await this.prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: user.id,
          email: emailKey,
          passwordHash: user.passwordHash,
          role: user.role,
          isEmailVerified: user.isVerified,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });

      // Crear el perfil inicial vinculado en la BD
      await tx.profile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
        },
      });
    });
  }

  public async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!raw) return null;
    return this.mapToDomain(raw);
  }

  public async findByEmail(email: Email): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { email: email.value.toLowerCase() },
      include: { profile: true },
    });

    if (!raw) return null;
    return this.mapToDomain(raw);
  }

  public async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.value.toLowerCase() },
    });
    return count > 0;
  }

  public async update(user: User): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: user.passwordHash,
        role: user.role,
        isEmailVerified: user.isVerified,
        isActive: user.isActive,
        updatedAt: user.updatedAt,
      },
    });
  }

  /**
   * Mapea el registro de Prisma a la entidad pura de dominio User.
   */
  private mapToDomain(record: any): User {
    const fullName = record.profile
      ? `${record.profile.firstName} ${record.profile.lastName}`.trim()
      : record.email.split('@')[0];

    return new User({
      id: record.id,
      email: new Email(record.email),
      fullName: fullName || 'Usuario',
      passwordHash: record.passwordHash || '',
      role: record.role as UserRole,
      isVerified: record.isEmailVerified,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
