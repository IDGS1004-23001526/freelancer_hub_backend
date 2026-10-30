import { Router } from 'express';
import { healthRouter } from './health.route.js';
import { authRouter } from '../presentation/routes/auth.routes.js';
import { profileRouter } from '../presentation/routes/profile.routes.js';
import { usersRouter } from './user.routes.js';
import { skillsRouter } from './skills.routes.js';

export const apiRouter = Router();

// Ruta de comprobación de salud
apiRouter.use('/health', healthRouter);

// Rutas de la API v1 (Módulo de Autenticación y Usuarios)
apiRouter.use('/v1/auth', authRouter);

// Rutas de la API v1 (Módulo de Perfiles y Onboarding)
apiRouter.use('/v1/profile', profileRouter);

// Rutas de la API v1 (Módulo de Usuarios - Swagger Spec)
apiRouter.use('/v1/users', usersRouter);

// Rutas de la API v1 (Catálogo Global de Habilidades)
apiRouter.use('/v1/skills', skillsRouter);
