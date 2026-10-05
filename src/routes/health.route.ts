import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'freelancer_hub_backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
