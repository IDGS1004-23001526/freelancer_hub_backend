import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher.js';
import { JwtTokenGenerator } from './infrastructure/security/jwt-token-generator.js';
import { InMemoryUserRepository } from './infrastructure/persistence/repositories/in-memory-user.repository.js';
import { InMemoryRefreshTokenRepository } from './infrastructure/persistence/repositories/in-memory-refresh-token.repository.js';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case.js';
import { AuthenticateUserUseCase } from './application/use-cases/authenticate-user.use-case.js';
import { RefreshSessionTokenUseCase } from './application/use-cases/refresh-session-token.use-case.js';
import { RevokeSessionUseCase } from './application/use-cases/revoke-session.use-case.js';
import { AuthController } from './presentation/controllers/auth.controller.js';
import { createAuthMiddleware } from './presentation/middlewares/auth.middleware.js';

/**
 * Contenedor de Inversión de Control (IoC) e Inyección de Dependencias.
 * Configura y enlaza todas las capas de la arquitectura limpia.
 */
export class Container {
  // Capa de Infraestructura
  public static readonly passwordHasher = new BcryptPasswordHasher();
  public static readonly jwtTokenGenerator = new JwtTokenGenerator();
  public static readonly userRepository = new InMemoryUserRepository();
  public static readonly refreshTokenRepository = new InMemoryRefreshTokenRepository();

  // Capa de Aplicación - Casos de Uso
  public static readonly registerUserUseCase = new RegisterUserUseCase(
    Container.userRepository,
    Container.refreshTokenRepository,
    Container.passwordHasher,
    Container.jwtTokenGenerator
  );

  public static readonly authenticateUserUseCase = new AuthenticateUserUseCase(
    Container.userRepository,
    Container.refreshTokenRepository,
    Container.passwordHasher,
    Container.jwtTokenGenerator
  );

  public static readonly refreshSessionTokenUseCase = new RefreshSessionTokenUseCase(
    Container.userRepository,
    Container.refreshTokenRepository,
    Container.jwtTokenGenerator
  );

  public static readonly revokeSessionUseCase = new RevokeSessionUseCase(
    Container.refreshTokenRepository,
    Container.jwtTokenGenerator
  );

  // Capa de Presentación
  public static readonly authController = new AuthController(
    Container.registerUserUseCase,
    Container.authenticateUserUseCase,
    Container.refreshSessionTokenUseCase,
    Container.revokeSessionUseCase,
    Container.userRepository
  );

  public static readonly authMiddleware = createAuthMiddleware(
    Container.jwtTokenGenerator
  );
}
