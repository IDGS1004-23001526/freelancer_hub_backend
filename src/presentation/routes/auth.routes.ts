import { Router } from 'express';
import { Container } from '../../container.js';
import { validateBody } from '../middlewares/validate-request.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} from '../../application/validation/auth.schemas.js';

export const authRouter = Router();

/**
 * @ruta POST /api/v1/auth/register
 * @descripcion Registra una nueva cuenta de usuario (Cliente o Freelancer)
 * @acceso Público
 */
authRouter.post(
  '/register',
  validateBody(registerSchema),
  Container.authController.register
);

/**
 * @ruta POST /api/v1/auth/login
 * @descripcion Autentica las credenciales de un usuario y emite tokens de sesión
 * @acceso Público
 */
authRouter.post(
  '/login',
  validateBody(loginSchema),
  Container.authController.login
);

/**
 * @ruta POST /api/v1/auth/refresh-token
 * @descripcion Rota el refresh token y emite una nueva sesión de autenticación
 * @acceso Público
 */
authRouter.post(
  '/refresh-token',
  validateBody(refreshTokenSchema),
  Container.authController.refreshToken
);

/**
 * @ruta POST /api/v1/auth/logout
 * @descripcion Revoca la sesión activa y su token de refresco
 * @acceso Público
 */
authRouter.post(
  '/logout',
  validateBody(logoutSchema),
  Container.authController.logout
);

/**
 * @ruta GET /api/v1/auth/me
 * @descripcion Obtiene el perfil del usuario autenticado
 * @acceso Protegido (Requiere cabecera Authorization Bearer)
 */
authRouter.get(
  '/me',
  Container.authMiddleware,
  Container.authController.getMe
);
