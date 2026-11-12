import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { Container } from './container.js';

const app = createApp();
const httpServer = createServer(app);

// Montar infraestructura de WebSockets (Socket.io) sobre el servidor HTTP
Container.realtimeServer.attach(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`🚀 Freelancer Hub Backend ejecutándose en http://localhost:${env.PORT}`);
  console.log(`🔌 Servidor WebSockets (Socket.io) activo en el mismo puerto`);
  console.log(`📡 Entorno: ${env.NODE_ENV}`);
});

/**
 * Cierre controlado del servidor HTTP y WebSockets ante señales de terminación (Graceful Shutdown).
 */
let isShuttingDown = false;

const cierreControlado = async (senal: string): Promise<void> => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 Recibida señal ${senal}, cerrando WebSockets y servidor HTTP de forma segura...`);

  const forceExitTimer = setTimeout(() => {
    console.warn('⚠️ Tiempo de espera agotado al cerrar conexiones; forzando salida.');
    process.exit(1);
  }, 5000);
  forceExitTimer.unref();

  try {
    await Container.realtimeServer.close();
  } catch (err) {
    console.error('❌ Error al cerrar servidor Socket.io:', err);
  }

  httpServer.close(() => {
    clearTimeout(forceExitTimer);
    console.log('✅ Servidor HTTP y WebSockets cerrados. Proceso finalizado.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => void cierreControlado('SIGTERM'));
process.on('SIGINT', () => void cierreControlado('SIGINT'));
