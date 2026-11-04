import { Router } from 'express';
import { healthRouter } from './health.route.js';
import { authRouter } from '../presentation/routes/auth.routes.js';
import { profileRouter } from './profile.routes.js';
import { internalTasksRouter } from './internal-tasks.routes.js';
import { internalTeamRouter } from './internal-team.routes.js';

export const apiRouter = Router();

// Ruta de comprobación de salud
apiRouter.use('/health', healthRouter);

// Rutas de la API v1 (Módulo de Autenticación y Usuarios)
apiRouter.use('/v1/auth', authRouter);

// Rutas de la API v1 (Módulo de Perfiles y Onboarding)
apiRouter.use('/v1/profile', profileRouter);

// Rutas de la API v1 (Módulo Interno de Tareas / Mini-Jira Equipo)
apiRouter.use('/v1/internal/tasks', internalTasksRouter);
apiRouter.use('/v1/internal/team', internalTeamRouter);
