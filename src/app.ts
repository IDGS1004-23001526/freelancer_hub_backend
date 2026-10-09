import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { centralizedErrorHandler } from './presentation/middlewares/error-handler.middleware.js';

/**
 * Fábrica de la aplicación Express.
 * Configura los middlewares globales de seguridad, logging, parsing y enrutamiento.
 */
export function createApp(): Express {
  const app = express();

  // Middlewares globales de seguridad y utilidades
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Endpoint base de bienvenida e información de la API
  app.get('/', (_req, res) => {
    res.json({
      nombre: 'Freelancer Hub Backend API',
      estado: 'en_linea',
      version: '1.0.0',
    });
  });

  // Rutas de la API
  app.use('/api', apiRouter);

  // Middlewares de captura de 404 y manejo centralizado de errores
  app.use(notFoundHandler);
  app.use(centralizedErrorHandler);

  return app;
}
