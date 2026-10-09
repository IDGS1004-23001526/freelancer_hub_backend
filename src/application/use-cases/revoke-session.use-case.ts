import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface.js';
import { IJwtTokenGenerator } from '../interfaces/jwt-token-generator.interface.js';
import { LogoutRequestDto } from '../validation/auth.schemas.js';

/**
 * Caso de Uso: Cierre de sesión y revocación del Refresh Token activo.
 */
export class RevokeSessionUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtTokenGenerator: IJwtTokenGenerator
  ) {}

  public async execute(dto: LogoutRequestDto): Promise<void> {
    const tokenHash = this.jwtTokenGenerator.hashRefreshToken(dto.refreshToken);
    await this.refreshTokenRepository.revokeByTokenHash(tokenHash);
  }
}
