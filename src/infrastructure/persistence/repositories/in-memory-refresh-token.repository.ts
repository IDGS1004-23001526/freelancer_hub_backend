import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface.js';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity.js';

interface RefreshTokenDatabaseRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  isRevoked: boolean;
  createdAt: string;
}

/**
 * Implementación en memoria del repositorio de Refresh Tokens con almacenamiento seguro por hash.
 */
export class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private readonly tokensByHash = new Map<string, RefreshTokenDatabaseRecord>();

  public async save(token: RefreshToken): Promise<void> {
    const registro: RefreshTokenDatabaseRecord = {
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt.toISOString(),
      isRevoked: token.isRevoked,
      createdAt: token.createdAt.toISOString(),
    };

    this.tokensByHash.set(token.tokenHash, registro);
  }

  public async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const registro = this.tokensByHash.get(tokenHash);
    if (!registro) return null;
    return this.mapToDomain(registro);
  }

  public async revokeByTokenHash(tokenHash: string): Promise<void> {
    const registro = this.tokensByHash.get(tokenHash);
    if (!registro) return;

    registro.isRevoked = true;
    this.tokensByHash.set(tokenHash, registro);
  }

  public async revokeAllByUserId(userId: string): Promise<void> {
    for (const [hash, registro] of this.tokensByHash.entries()) {
      if (registro.userId === userId) {
        registro.isRevoked = true;
        this.tokensByHash.set(hash, registro);
      }
    }
  }

  public async deleteExpired(): Promise<number> {
    const ahora = new Date();
    let eliminados = 0;

    for (const [hash, registro] of this.tokensByHash.entries()) {
      if (new Date(registro.expiresAt) < ahora || registro.isRevoked) {
        this.tokensByHash.delete(hash);
        eliminados++;
      }
    }

    return eliminados;
  }

  /**
   * Mapea el registro de persistencia a la entidad de dominio.
   */
  private mapToDomain(record: RefreshTokenDatabaseRecord): RefreshToken {
    return new RefreshToken({
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      expiresAt: new Date(record.expiresAt),
      isRevoked: record.isRevoked,
      createdAt: new Date(record.createdAt),
    });
  }
}
