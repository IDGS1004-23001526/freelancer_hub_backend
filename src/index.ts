import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Freelancer Hub Backend ejecutándose en http://localhost:${env.PORT}`);
  console.log(`📡 Entorno: ${env.NODE_ENV}`);
});

/**
 * Cierre controlado del servidor HTTP ante señales de terminación del sistema (Graceful Shutdown).
 */
const cierreControlado = (senal: string) => {
  console.log(`\n🛑 Recibida señal ${senal}, cerrando el servidor de forma segura...`);
  server.close(() => {
    console.log('✅ Servidor HTTP cerrado. Proceso finalizado.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => cierreControlado('SIGTERM'));
process.on('SIGINT', () => cierreControlado('SIGINT'));
