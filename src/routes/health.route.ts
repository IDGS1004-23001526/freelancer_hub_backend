import { Router, Request, Response } from 'express';

export const healthRouter = Router();

/**
 * @ruta GET /api/health
 * @descripcion Endpoint para verificar el estado de salud y tiempo activo del backend
 */
healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    estado: 'ok',
    servicio: 'freelancer_hub_backend',
    fechaHora: new Date().toISOString(),
    tiempoActivoSegundos: process.uptime(),
  });
});
