import { Router } from 'express';
import { healthRouter } from './health.route.js';
import { authRouter } from '../presentation/routes/auth.routes.js';

export const apiRouter = Router();

// Ruta de comprobación de salud
apiRouter.use('/health', healthRouter);

// Rutas de la API v1 (Módulo de Autenticación y Usuarios)
apiRouter.use('/v1/auth', authRouter);
