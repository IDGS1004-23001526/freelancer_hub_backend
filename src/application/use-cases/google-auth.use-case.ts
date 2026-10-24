import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../../domain/repositories/user.repository.interface.js';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface.js';
import { IJwtTokenGenerator } from '../interfaces/jwt-token-generator.interface.js';
import { GoogleAuthRequestDto } from '../validation/auth.schemas.js';
import { AuthResponseDto } from '../dtos/auth-response.dto.js';
import { toUserProfileDto } from '../dtos/user-profile.dto.js';
import { Email } from '../../domain/value-objects/email.vo.js';
import { User } from '../../domain/entities/user.entity.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import {
  InvalidCredentialsException,
  InactiveUserException,
} from '../../domain/exceptions/domain.exception.js';
import { env } from '../../config/env.js';

export class GoogleAuthUseCase {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtTokenGenerator: IJwtTokenGenerator
  ) {
    this.googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }

  public async execute(dto: GoogleAuthRequestDto): Promise<AuthResponseDto> {
    // 1. Verificar el ID Token con la API de Google
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new InvalidCredentialsException();
    }

    if (!payload || !payload.email) {
      throw new InvalidCredentialsException();
    }

    const emailVO = new Email(payload.email);
    const fullName = payload.name || payload.email.split('@')[0];

    // 2. Buscar si el usuario ya existe en base de datos
    let user = await this.userRepository.findByEmail(emailVO);

    if (user) {
      if (!user.isActive) {
        throw new InactiveUserException();
      }
      // Si aún no estaba verificado, marcar como verificado dado que Google valida el email
      if (!user.isVerified) {
        user.verifyEmail();
        await this.userRepository.save(user);
      }
    } else {
      // 3. Si no existe, crear nuevo usuario federado
      const userId = uuidv4();
      user = User.create({
        id: userId,
        email: emailVO,
        fullName,
        passwordHash: 'OAUTH_GOOGLE_FEDERATED_ACCOUNT',
        role: dto.role,
        isVerified: true,
        isActive: true,
      });

      await this.userRepository.save(user);
    }

    // 4. Emitir tokens JWT del sistema
    const accessToken = this.jwtTokenGenerator.generateAccessToken({
      sub: user.id,
      email: user.email.value,
      role: user.role,
      isVerified: user.isVerified,
    });

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
