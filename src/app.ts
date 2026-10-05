import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Global Security & Utility Middlewares
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

  // Base endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: 'Freelancer Hub Backend API',
      status: 'online',
      version: '1.0.0',
    });
  });

  // API Routes
  app.use('/api', apiRouter);

  // Error Handling Middlewares
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
