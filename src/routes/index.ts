import { Router } from 'express';
import { healthRouter } from './health.route.js';
import { authRouter } from '../presentation/routes/auth.routes.js';
import { profileRouter } from './profile.routes.js';
import { projectRouter } from '../presentation/routes/project.routes.js';

export const apiRouter = Router();

// Ruta de comprobación de salud
apiRouter.use('/health', healthRouter);

// Rutas de la API v1 (Módulo de Autenticación y Usuarios)
apiRouter.use('/v1/auth', authRouter);

// Rutas de la API v1 (Módulo de Perfil)
apiRouter.use('/v1/profile', profileRouter);

// Rutas de la API v1 (Módulo de Proyectos)
apiRouter.use('/v1/projects', projectRouter);