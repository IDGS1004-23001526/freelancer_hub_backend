import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Freelancer Hub Backend running on http://localhost:${env.PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
});

const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}, closing server gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed. Process terminating.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
