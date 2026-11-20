import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case.js';
import { AuthenticateUserUseCase } from '../../application/use-cases/authenticate-user.use-case.js';
import { GoogleAuthUseCase } from '../../application/use-cases/google-auth.use-case.js';
import { RefreshSessionTokenUseCase } from '../../application/use-cases/refresh-session-token.use-case.js';
import { RevokeSessionUseCase } from '../../application/use-cases/revoke-session.use-case.js';
import { IUserRepository } from '../../domain/repositories/user.repository.interface.js';
import { toUserProfileDto } from '../../application/dtos/user-profile.dto.js';
import { UserNotFoundException } from '../../domain/exceptions/domain.exception.js';
import { Container } from '../../container.js';

/**
 * Controlador de la API para Autenticación, Registro y Sesiones.
 */
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly googleAuthUseCase: GoogleAuthUseCase,
    private readonly refreshSessionTokenUseCase: RefreshSessionTokenUseCase,
    private readonly revokeSessionUseCase: RevokeSessionUseCase,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Registra un nuevo usuario en la plataforma.
   */
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resultado = await this.registerUserUseCase.execute(req.body);

      Container.logger.info('Nuevo usuario registrado exitosamente', {
        context: 'AUTH',
        action: 'REGISTER_USER',
        statusCode: 201,
        userId: resultado.user.id,
        email: resultado.user.email,
        role: resultado.user.role,
      });

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Usuario registrado exitosamente.',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Inicia sesión y emite tokens de autenticación.
   */
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resultado = await this.authenticateUserUseCase.execute(req.body);

      Container.logger.info('Autenticación de usuario exitosa', {
        context: 'AUTH',
        action: 'LOGIN_SUCCESS',
        statusCode: 200,
        userId: resultado.user.id,
        email: resultado.user.email,
        role: resultado.user.role,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Autenticación exitosa.',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Autenticación con cuenta de Google (Login y Registro federado).
   */
  public googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resultado = await this.googleAuthUseCase.execute(req.body);

      Container.logger.info('Autenticación federada con Google exitosa', {
        context: 'AUTH',
        action: 'GOOGLE_AUTH_SUCCESS',
        statusCode: 200,
        userId: resultado.user.id,
        email: resultado.user.email,
        role: resultado.user.role,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Autenticación con Google exitosa.',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Rota el token de refresco y renueva la sesión activa.
   */
  public refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resultado = await this.refreshSessionTokenUseCase.execute(req.body);

      Container.logger.info('Sesión renovada y token rotado exitosamente', {
        context: 'AUTH',
        action: 'TOKEN_ROTATED',
        statusCode: 200,
        userId: resultado.user.id,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Sesión renovada exitosamente.',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cierra la sesión y revoca el token de refresco.
   */
  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.revokeSessionUseCase.execute(req.body);

      Container.logger.info('Cierre de sesión y revocación de token exitosa', {
        context: 'AUTH',
        action: 'LOGOUT_SUCCESS',
        statusCode: 200,
        userId: req.user?.sub,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Sesión cerrada y token revocado correctamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene la información del perfil del usuario autenticado actual.
   */
  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new UserNotFoundException('Contexto de usuario ausente');
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundException(userId);
      }

      Container.logger.info('Perfil del usuario autenticado consultado', {
        context: 'AUTH',
        action: 'GET_ME',
        statusCode: 200,
        userId,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Perfil de usuario obtenido correctamente.',
        data: toUserProfileDto(user),
      });
    } catch (error) {
      next(error);
    }
  };
}
