import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher.js';
import { JwtTokenGenerator } from './infrastructure/security/jwt-token-generator.js';
import { InMemoryUserRepository } from './infrastructure/persistence/repositories/in-memory-user.repository.js';
import { PrismaUserRepository } from './infrastructure/persistence/repositories/prisma-user.repository.js';
import { InMemoryRefreshTokenRepository } from './infrastructure/persistence/repositories/in-memory-refresh-token.repository.js';
import { InMemoryProfileRepository } from './infrastructure/persistence/repositories/in-memory-profile.repository.js';
import { PrismaProfileRepository } from './infrastructure/persistence/repositories/prisma-profile.repository.js';
import { prisma } from './infrastructure/persistence/prisma/prisma.client.js';
import { LocalStorageService } from './infrastructure/storage/local-storage.service.js';

import { RegisterUserUseCase } from './application/use-cases/register-user.use-case.js';
import { AuthenticateUserUseCase } from './application/use-cases/authenticate-user.use-case.js';
import { GoogleAuthUseCase } from './application/use-cases/google-auth.use-case.js';
import { RefreshSessionTokenUseCase } from './application/use-cases/refresh-session-token.use-case.js';
import { RevokeSessionUseCase } from './application/use-cases/revoke-session.use-case.js';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case.js';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case.js';
import { UploadAvatarUseCase } from './application/use-cases/upload-avatar.use-case.js';

import { GetOnboardingStatusUseCase } from './application/use-cases/get-onboarding-status.use-case.js';
import { UpdateProfessionalInfoUseCase } from './application/use-cases/update-professional-info.use-case.js';
import { UpdateSkillsUseCase } from './application/use-cases/update-skills.use-case.js';
import { AddPortfolioItemUseCase } from './application/use-cases/add-portfolio-item.use-case.js';
import { DeletePortfolioItemUseCase } from './application/use-cases/delete-portfolio-item.use-case.js';
import { AuthController } from './presentation/controllers/auth.controller.js';
import { ProfileController } from './presentation/controllers/profile.controller.js';
import { createAuthMiddleware } from './presentation/middlewares/auth.middleware.js';

/**
 * Contenedor de Inversión de Control (IoC) e Inyección de Dependencias.
 * Configura y enlaza todas las capas de la arquitectura limpia.
 */
export class Container {
  // Capa de Infraestructura
  public static readonly passwordHasher = new BcryptPasswordHasher();
  public static readonly jwtTokenGenerator = new JwtTokenGenerator();
  public static readonly userRepository = new PrismaUserRepository(prisma);
  public static readonly refreshTokenRepository = new InMemoryRefreshTokenRepository();
  public static readonly profileRepository = new PrismaProfileRepository(prisma);
  public static readonly storageService = new LocalStorageService();

  // Capa de Aplicación - Casos de Uso (Auth)
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

  public static readonly googleAuthUseCase = new GoogleAuthUseCase(
    Container.userRepository,
    Container.refreshTokenRepository,
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

  // Capa de Aplicación - Casos de Uso (Profile / Onboarding)
  public static readonly getOnboardingStatusUseCase = new GetOnboardingStatusUseCase();
  public static readonly getProfileUseCase = new GetProfileUseCase(Container.userRepository);
  public static readonly updateProfessionalInfoUseCase = new UpdateProfessionalInfoUseCase(
    Container.userRepository
  );
  public static readonly updateSkillsUseCase = new UpdateSkillsUseCase(
    Container.userRepository
  );
  public static readonly addPortfolioItemUseCase = new AddPortfolioItemUseCase(
    Container.userRepository
  );
  public static readonly deletePortfolioItemUseCase = new DeletePortfolioItemUseCase(
    Container.userRepository
  );

  public static readonly updateProfileUseCase = new UpdateProfileUseCase(
    Container.profileRepository
  );

  public static readonly uploadAvatarUseCase = new UploadAvatarUseCase(
    Container.profileRepository,
    Container.storageService
  );

  // Capa de Presentación
  public static readonly authController = new AuthController(
    Container.registerUserUseCase,
    Container.authenticateUserUseCase,
    Container.googleAuthUseCase,
    Container.refreshSessionTokenUseCase,
    Container.revokeSessionUseCase,
    Container.userRepository
  );

  public static readonly profileController = new ProfileController(
    Container.getOnboardingStatusUseCase,
    Container.getProfileUseCase,
    Container.updateProfessionalInfoUseCase,
    Container.updateSkillsUseCase,
    Container.addPortfolioItemUseCase,
    Container.deletePortfolioItemUseCase
  );

  public static readonly authMiddleware = createAuthMiddleware(
    Container.jwtTokenGenerator
  );
}
