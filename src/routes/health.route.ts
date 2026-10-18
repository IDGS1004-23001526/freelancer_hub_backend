import os from 'os';
import { Router, Request, Response } from 'express';
import { prisma } from '../infrastructure/persistence/prisma/prisma.client.js';
import { env } from '../config/env.js';

export const healthRouter = Router();

/**
 * Función auxiliar para formatear segundos en formato legible (Xd Xh Xm Xs).
 */
function formatearTiempoActivo(segundos: number): string {
  const dias = Math.floor(segundos / 86400);
  const horas = Math.floor((segundos % 86400) / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = Math.floor(segundos % 60);

  const partes: string[] = [];
  if (dias > 0) partes.push(`${dias}d`);
  if (horas > 0) partes.push(`${horas}h`);
  if (minutos > 0) partes.push(`${minutos}m`);
  partes.push(`${segs}s`);

  return partes.join(' ');
}

/**
 * Obtiene las métricas en vivo del servidor y verifica el estado de PostgreSQL vía Prisma.
 */
async function obtenerEstadoSalud() {
  const inicioDb = Date.now();
  let dbConectada = false;
  let dbMensaje = 'Conectada (PostgreSQL 16)';
  let dbLatenciaMs = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConectada = true;
    dbLatenciaMs = Date.now() - inicioDb;
  } catch (error) {
    dbConectada = false;
    dbMensaje = error instanceof Error ? error.message : 'Error de conexión a PostgreSQL';
    dbLatenciaMs = Date.now() - inicioDb;
  }

  const memProceso = process.memoryUsage();
  const memTotalSistema = os.totalmem();
  const memLibreSistema = os.freemem();
  const memUsadaSistema = memTotalSistema - memLibreSistema;

  return {
    estado: dbConectada ? 'ok' : 'degradado',
    servicio: 'freelancer_hub_backend',
    entorno: env.NODE_ENV,
    fechaHora: new Date().toISOString(),
    tiempoActivoSegundos: Math.floor(process.uptime()),
    tiempoActivoFormateado: formatearTiempoActivo(process.uptime()),
    baseDeDatos: {
      conectada: dbConectada,
      estado: dbConectada ? 'OPERATIVA' : 'SIN_CONEXION',
      latenciaMs: dbLatenciaMs,
      detalle: dbMensaje,
    },
    sistema: {
      hostname: os.hostname(),
      plataforma: `${os.type()} ${os.release()} (${os.arch()})`,
      nodeVersion: process.version,
      cpus: os.cpus().length,
      cargaPromedio: os.loadavg().map((n) => Number(n.toFixed(2))),
      memoriaProcesoMB: {
        rss: Number((memProceso.rss / 1024 / 1024).toFixed(2)),
        heapUsed: Number((memProceso.heapUsed / 1024 / 1024).toFixed(2)),
        heapTotal: Number((memProceso.heapTotal / 1024 / 1024).toFixed(2)),
      },
      memoriaSistemaGB: {
        usada: Number((memUsadaSistema / 1024 / 1024 / 1024).toFixed(2)),
        total: Number((memTotalSistema / 1024 / 1024 / 1024).toFixed(2)),
        porcentaje: Number(((memUsadaSistema / memTotalSistema) * 100).toFixed(1)),
      },
    },
  };
}

/**
 * Renderiza la página HTML del Dashboard de Salud del Servidor.
 */
function renderizarDashboardHtml(datos: Awaited<ReturnType<typeof obtenerEstadoSalud>>): string {
  const esOk = datos.estado === 'ok';
  const colorEstado = esOk ? '#10b981' : '#f59e0b';
  const textoEstado = esOk ? 'SISTEMA OPERATIVO' : 'SISTEMA DEGRADADO';
  const colorDb = datos.baseDeDatos.conectada ? '#10b981' : '#ef4444';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="refresh" content="10" />
  <title>FreelancerHub — Estado del Servidor</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #3b82f6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      padding: 2rem 1rem;
      line-height: 1.5;
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
    }
    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }
    .brand h1 {
      font-size: 1.4rem;
      font-weight: 700;
    }
    .brand p {
      color: var(--muted);
      font-size: 0.9rem;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 0.85rem;
      background: rgba(16, 185, 129, 0.15);
      color: ${colorEstado};
      border: 1px solid ${colorEstado};
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: ${colorEstado};
      display: inline-block;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
    }
    .card h2 {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.5rem;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.65rem;
      font-size: 0.95rem;
    }
    .stat-label { color: var(--muted); }
    .stat-value { font-weight: 600; font-family: monospace; }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: var(--border);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 0.5rem;
    }
    .progress-fill {
      height: 100%;
      background: var(--accent);
      width: ${datos.sistema.memoriaSistemaGB.porcentaje}%;
    }
    .links {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      font-size: 0.9rem;
    }
    .links a {
      color: var(--accent);
      text-decoration: none;
      font-weight: 600;
    }
    .links a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <h1>FreelancerHub — Monitor de Salud (Health Check)</h1>
        <p>Servidor: <strong>${datos.sistema.hostname}</strong> • Actualización automática cada 10s</p>
      </div>
      <div class="badge">
        <span class="dot"></span>
        ${textoEstado}
      </div>
    </header>

    <div class="grid">
      <div class="card">
        <h2>Estado del Servicio API</h2>
        <div class="stat-row">
          <span class="stat-label">Servicio:</span>
          <span class="stat-value">${datos.servicio}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Entorno:</span>
          <span class="stat-value">${datos.entorno}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Tiempo Activo (Uptime):</span>
          <span class="stat-value">${datos.tiempoActivoFormateado}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Node.js Runtime:</span>
          <span class="stat-value">${datos.sistema.nodeVersion}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Timestamp UTC:</span>
          <span class="stat-value">${datos.fechaHora}</span>
        </div>
      </div>

      <div class="card">
        <h2>Base de Datos (PostgreSQL / Podman)</h2>
        <div class="stat-row">
          <span class="stat-label">Estado:</span>
          <span class="stat-value" style="color: ${colorDb}">${datos.baseDeDatos.estado}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Latencia de Consulta:</span>
          <span class="stat-value">${datos.baseDeDatos.latenciaMs} ms</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">ORM:</span>
          <span class="stat-value">Prisma Client v6</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Detalle:</span>
          <span class="stat-value">${datos.baseDeDatos.detalle}</span>
        </div>
      </div>

      <div class="card">
        <h2>Recursos del Servidor (Homelab)</h2>
        <div class="stat-row">
          <span class="stat-label">Plataforma:</span>
          <span class="stat-value">${datos.sistema.plataforma}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Núcleos CPU / Carga:</span>
          <span class="stat-value">${datos.sistema.cpus} vCPU (${datos.sistema.cargaPromedio.join(', ')})</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">RAM Proceso Node (RSS):</span>
          <span class="stat-value">${datos.sistema.memoriaProcesoMB.rss} MB</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">RAM Sistema:</span>
          <span class="stat-value">${datos.sistema.memoriaSistemaGB.usada} GB / ${datos.sistema.memoriaSistemaGB.total} GB (${datos.sistema.memoriaSistemaGB.porcentaje}%)</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>
    </div>

    <div class="links">
      <div>
        <a href="/api/docs">Documentación Swagger UI</a> &nbsp;|&nbsp;
        <a href="/api/health?format=json">Ver Respuesta JSON</a> &nbsp;|&nbsp;
        <a href="/">Raíz API</a>
      </div>
      <span style="color: var(--muted)">FreelancerHub Backend v1.0.0</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * @ruta GET /api/health
 * @descripcion Devuelve el estado de salud en JSON o renderiza el panel HTML si se visita desde un navegador.
 */
healthRouter.get('/', async (req: Request, res: Response) => {
  const datos = await obtenerEstadoSalud();
  const códigoHttp = datos.estado === 'ok' ? 200 : 503;

  const aceptaHtml = req.headers.accept?.includes('text/html');
  const forzarJson = req.query.format === 'json';

  if (aceptaHtml && !forzarJson) {
    res.status(códigoHttp).setHeader('Content-Type', 'text/html; charset=utf-8').send(renderizarDashboardHtml(datos));
    return;
  }

  res.status(códigoHttp).json(datos);
});
