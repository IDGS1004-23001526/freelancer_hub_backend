import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../../domain/repositories/user.repository.interface.js';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface.js';
import { IPasswordHasher } from '../interfaces/password-hasher.interface.js';
import { IJwtTokenGenerator } from '../interfaces/jwt-token-generator.interface.js';
import { RegisterRequestDto } from '../validation/auth.schemas.js';
import { AuthResponseDto } from '../dtos/auth-response.dto.js';
import { toUserProfileDto } from '../dtos/user-profile.dto.js';
import { Email } from '../../domain/value-objects/email.vo.js';
import { User } from '../../domain/entities/user.entity.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { UserAlreadyExistsException } from '../../domain/exceptions/domain.exception.js';
import { env } from '../../config/env.js';

/**
 * Caso de Uso: Registro de un nuevo usuario en la plataforma FreelancerHub.
 */
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly jwtTokenGenerator: IJwtTokenGenerator
  ) {}

  public async execute(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    // 1. Instanciación y normalización del correo mediante Value Object
    const emailVO = new Email(dto.email);

    // 2. Validación de duplicidad en persistencia
    const emailExiste = await this.userRepository.existsByEmail(emailVO);
    if (emailExiste) {
      throw new UserAlreadyExistsException(emailVO.value);
    }

    // 3. Cifrado seguro de la contraseña
    const passwordHash = await this.passwordHasher.hash(dto.password);
    const userId = uuidv4();

    // 4. Creación de la entidad de dominio User
    const user = User.create({
      id: userId,
      email: emailVO,
      fullName: dto.fullName,
      passwordHash,
      role: dto.role,
      isVerified: false,
      isActive: true,
    });

    await this.userRepository.save(user);

    // 5. Emisión de Access Token y Refresh Token
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
