import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../../domain/repositories/user.repository.interface.js';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface.js';
import { IPasswordHasher } from '../interfaces/password-hasher.interface.js';
import { IJwtTokenGenerator } from '../interfaces/jwt-token-generator.interface.js';
import { LoginRequestDto } from '../validation/auth.schemas.js';
import { AuthResponseDto } from '../dtos/auth-response.dto.js';
import { toUserProfileDto } from '../dtos/user-profile.dto.js';
import { Email } from '../../domain/value-objects/email.vo.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import {
  InvalidCredentialsException,
  InactiveUserException,
} from '../../domain/exceptions/domain.exception.js';
import { env } from '../../config/env.js';

/**
 * Caso de Uso: Autenticación de usuarios (Login) con mitigación de ataques de enumeración.
 */
export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly jwtTokenGenerator: IJwtTokenGenerator
  ) {}

  public async execute(dto: LoginRequestDto): Promise<AuthResponseDto> {
    let emailVO: Email;
    try {
      emailVO = new Email(dto.email);
    } catch {
      // Para evitar ataques de enumeración de usuarios, siempre se lanza excepción genérica 401
      throw new InvalidCredentialsException();
    }

    // 1. Búsqueda del usuario por correo normalizado
    const user = await this.userRepository.findByEmail(emailVO);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    // 2. Verificación de estado de cuenta
    if (!user.isActive) {
      throw new InactiveUserException();
    }

    // 3. Verificación de contraseña mediante el hash
    const esPasswordValida = await this.passwordHasher.compare(
      dto.password,
      user.passwordHash
    );

    if (!esPasswordValida) {
      throw new InvalidCredentialsException();
    }

    // 4. Generación de Access Token con claims de usuario
    const accessToken = this.jwtTokenGenerator.generateAccessToken({
      sub: user.id,
      email: user.email.value,
      role: user.role,
      isVerified: user.isVerified,
    });

    // 5. Generación y almacenamiento de Refresh Token
    const refreshData = this.jwtTokenGenerator.generateRefreshToken();
    const refreshTokenEntity = RefreshToken.create({
      id: uuidv4(),
      userId: user.id,
      tokenHash: refreshData.tokenHash,
      expiresAt: refreshData.expiresAt,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken: refreshData.rawToken,
      tokenType: 'Bearer',
      expiresIn: env.JWT_ACCESS_EXPIRATION,
      user: toUserProfileDto(user),
    };
  }
}
