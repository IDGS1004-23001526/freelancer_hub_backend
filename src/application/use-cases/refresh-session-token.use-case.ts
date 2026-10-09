import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../../domain/repositories/user.repository.interface.js';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface.js';
import { IJwtTokenGenerator } from '../interfaces/jwt-token-generator.interface.js';
import { RefreshTokenRequestDto } from '../validation/auth.schemas.js';
import { AuthResponseDto } from '../dtos/auth-response.dto.js';
import { toUserProfileDto } from '../dtos/user-profile.dto.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import {
  InvalidTokenException,
  InactiveUserException,
  UserNotFoundException,
} from '../../domain/exceptions/domain.exception.js';
import { env } from '../../config/env.js';

/**
 * Caso de Uso: Renovación de sesión con rotación obligatoria de Refresh Token.
 */
export class RefreshSessionTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtTokenGenerator: IJwtTokenGenerator
  ) {}

  public async execute(dto: RefreshTokenRequestDto): Promise<AuthResponseDto> {
    const tokenHash = this.jwtTokenGenerator.hashRefreshToken(dto.refreshToken);

    // 1. Verificación del Refresh Token en la persistencia
    const tokenAlmacenado = await this.refreshTokenRepository.findByTokenHash(tokenHash);
    if (!tokenAlmacenado || !tokenAlmacenado.isValid()) {
      throw new InvalidTokenException('Token de refresco inválido, revocado o expirado.');
    }

    // 2. Comprobación del usuario asociado
    const user = await this.userRepository.findById(tokenAlmacenado.userId);
    if (!user) {
      throw new UserNotFoundException(tokenAlmacenado.userId);
    }

    if (!user.isActive) {
      throw new InactiveUserException();
    }

    // 3. Rotación de tokens: Revocación inmediata del token anterior
    await this.refreshTokenRepository.revokeByTokenHash(tokenHash);

    // 4. Emisión de nuevo Access Token y nuevo Refresh Token
    const accessToken = this.jwtTokenGenerator.generateAccessToken({
      sub: user.id,
      email: user.email.value,
      role: user.role,
      isVerified: user.isVerified,
    });

    const newRefreshData = this.jwtTokenGenerator.generateRefreshToken();
    const newRefreshTokenEntity = RefreshToken.create({
      id: uuidv4(),
      userId: user.id,
      tokenHash: newRefreshData.tokenHash,
      expiresAt: newRefreshData.expiresAt,
    });

    await this.refreshTokenRepository.save(newRefreshTokenEntity);

    return {
      accessToken,
      refreshToken: newRefreshData.rawToken,
      tokenType: 'Bearer',
      expiresIn: env.JWT_ACCESS_EXPIRATION,
      user: toUserProfileDto(user),
    };
  }
}
