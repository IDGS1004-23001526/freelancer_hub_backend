import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher.js';
import { JwtTokenGenerator } from './infrastructure/security/jwt-token-generator.js';
import { InMemoryUserRepository } from './infrastructure/persistence/repositories/in-memory-user.repository.js';
import { PrismaUserRepository } from './infrastructure/persistence/repositories/prisma-user.repository.js';
import { InMemoryRefreshTokenRepository } from './infrastructure/persistence/repositories/in-memory-refresh-token.repository.js';
import { InMemoryProfileRepository } from './infrastructure/persistence/repositories/in-memory-profile.repository.js';
import { PrismaProfileRepository } from './infrastructure/persistence/repositories/prisma-profile.repository.js';
import { prisma } from './infrastructure/persistence/prisma/prisma.client.js';
import { LocalStorageService } from './infrastructure/storage/local-storage.service.js';
import { LoggerService } from './infrastructure/logging/logger.service.js';

import { RegisterUserUseCase } from './application/use-cases/register-user.use-case.js';
import { AuthenticateUserUseCase } from './application/use-cases/authenticate-user.use-case.js';
import { GoogleAuthUseCase } from './application/use-cases/google-auth.use-case.js';
import { RefreshSessionTokenUseCase } from './application/use-cases/refresh-session-token.use-case.js';
import { RevokeSessionUseCase } from './application/use-cases/revoke-session.use-case.js';

import { GetProfileUseCase } from './application/use-cases/get-profile.use-case.js';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case.js';
import { UploadAvatarUseCase } from './application/use-cases/upload-avatar.use-case.js';

import { AuthController } from './presentation/controllers/auth.controller.js';
import { createAuthMiddleware } from './presentation/middlewares/auth.middleware.js';

import { PrismaProjectRepository } from './infrastructure/persistence/repositories/prisma-proyect.repository.js';
import { CreateProjectUseCase } from './application/use-cases/create-project.use-case.js';
import { GetProjectsUseCase } from './application/use-cases/get-projects.use-case.js';
import { ProjectController } from './presentation/controllers/project.controller.js';

import { PrismaProposalRepository } from './infrastructure/persistence/repositories/prisma-proposal.repository.js';
import { SubmitProposalUseCase } from './application/use-cases/submit-proposal.use-case.js';
import { ProposalController } from './presentation/controllers/proposal.controller.js';
import { ContractEscrowUseCase } from './application/use-cases/contract-escrow.use-case.js';
import { ContractController } from './presentation/controllers/contract.controller.js';
import { WalletUseCase } from './application/use-cases/wallet.use-case.js';
import { WalletController } from './presentation/controllers/wallet.controller.js';
import { RealtimeSocketServer } from './infrastructure/realtime/socket.server.js';
import { IRealtimeNotifier } from './application/interfaces/realtime-notifier.interface.js';
import { FirebaseNotificationService } from './infrastructure/notifications/firebase-notification.service.js';

/**
 * Contenedor de Inversión de Control (IoC) e Inyección de Dependencias.
 * Configura y enlaza todas las capas de la arquitectura limpia.
 */
export class Container {
  // Capa de Infraestructura
  public static readonly logger = new LoggerService();
  public static readonly passwordHasher = new BcryptPasswordHasher();
  public static readonly jwtTokenGenerator = new JwtTokenGenerator();
  public static readonly userRepository = new PrismaUserRepository(prisma);
  public static readonly refreshTokenRepository = new InMemoryRefreshTokenRepository();
  public static readonly profileRepository = new PrismaProfileRepository(prisma);
  public static readonly storageService = new LocalStorageService();
  public static readonly projectRepository = new PrismaProjectRepository(prisma);
  public static readonly proposalRepository = new PrismaProposalRepository(prisma);
  public static readonly pushNotificationService = new FirebaseNotificationService({
    logger: Container.logger,
  });
  public static readonly realtimeServer = new RealtimeSocketServer(
    Container.jwtTokenGenerator,
    {
      logger: Container.logger,
      onMessageNotification: (recipientId, payload) => {
        void Container.pushNotificationService.sendPushNotification({
          recipientId,
          title: `Nuevo mensaje de ${payload.senderName || 'Freelancer Hub'}`,
          body: payload.content || 'Te ha enviado un mensaje.',
          data: {
            conversationId: payload.conversationId || payload.contractId,
            contractId: payload.contractId,
            senderId: payload.senderId,
            senderName: payload.senderName || '',
            senderRole: payload.senderRole || '',
            content: payload.content || '',
            id: payload.id,
          },
        });
      },
    }
  );
  public static readonly realtimeNotifier: IRealtimeNotifier = Container.realtimeServer;

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

  // Capa de Aplicación - Casos de Uso (Profile)
  public static readonly getProfileUseCase = new GetProfileUseCase(
    Container.profileRepository
  );

  public static readonly updateProfileUseCase = new UpdateProfileUseCase(
    Container.profileRepository
  );

  public static readonly uploadAvatarUseCase = new UploadAvatarUseCase(
    Container.profileRepository,
    Container.storageService
  );

  // Capa de Aplicación - Casos de Uso (Proyectos y Propuestas)
  public static readonly createProjectUseCase = new CreateProjectUseCase(
    Container.projectRepository
  );

  public static readonly getProjectsUseCase = new GetProjectsUseCase(
    Container.projectRepository
  );

  public static readonly submitProposalUseCase = new SubmitProposalUseCase(
    Container.proposalRepository
  );

  public static readonly contractEscrowUseCase = new ContractEscrowUseCase();
  public static readonly walletUseCase = new WalletUseCase();

  // Capa de Presentación
  public static readonly authController = new AuthController(
    Container.registerUserUseCase,
    Container.authenticateUserUseCase,
    Container.googleAuthUseCase,
    Container.refreshSessionTokenUseCase,
    Container.revokeSessionUseCase,
    Container.userRepository
  );

  public static readonly authMiddleware = createAuthMiddleware(
    Container.jwtTokenGenerator
  );

  public static readonly projectController = new ProjectController(
    Container.createProjectUseCase,
    Container.getProjectsUseCase
  );

  public static readonly proposalController = new ProposalController(
    Container.submitProposalUseCase,
    Container.proposalRepository
  );

  public static readonly contractController = new ContractController(
    Container.contractEscrowUseCase
  );

  public static readonly walletController = new WalletController(
    Container.walletUseCase
  );
}
