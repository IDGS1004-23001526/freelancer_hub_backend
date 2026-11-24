import { PrismaClient, RefreshToken as PrismaRefreshTokenModel } from '@prisma/client';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface.js';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity.js';

/**
 * Implementación persistente en PostgreSQL (Prisma ORM) del repositorio de Refresh Tokens.
 */
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async save(token: RefreshToken): Promise<void> {
    await this.prisma.refreshToken.upsert({
      where: { tokenHash: token.tokenHash },
      update: {
        isRevoked: token.isRevoked,
        expiresAt: token.expiresAt,
      },
      create: {
        id: token.id,
        userId: token.userId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        isRevoked: token.isRevoked,
        createdAt: token.createdAt,
      },
    });
  }

  public async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!record) return null;
    return this.mapToDomain(record);
  }

  public async revokeByTokenHash(tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  }

  public async revokeAllByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  public async deleteExpired(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ],
      },
    });
    return result.count;
  }

  private mapToDomain(record: PrismaRefreshTokenModel): RefreshToken {
    return new RefreshToken({
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      isRevoked: record.isRevoked,
      createdAt: record.createdAt,
    });
  }
}
