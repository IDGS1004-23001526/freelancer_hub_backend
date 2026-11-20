import { runAllApisFlow } from './generate-api-logs-core.js';

const isOnce = process.argv.includes('--once');
const intervalArg = process.argv.find((a) => a.startsWith('--interval='));
const intervalMinutes = intervalArg ? Number(intervalArg.split('=')[1]) || 5 : 5;
const intervalMs = intervalMinutes * 60 * 1000;

let iteration = 0;

async function executeCycle() {
  iteration++;
  const timestamp = new Date().toISOString();
  console.log(`\n======================================================`);
  console.log(`[Ronda #${iteration}] ${timestamp} — Disparando APIs para generación de logs...`);
  console.log(`======================================================`);

  try {
    const result = await runAllApisFlow();
    console.log(`[OK] Ronda #${iteration} completada con éxito en ${result.durationMs}ms`);
    console.log(`   * APIs invocadas: ${result.totalRequests}`);
    console.log(`   * Peticiones exitosas: ${result.successfulRequests}`);
    console.log(`   * Alertas generadas (400, 401, 403): ${result.warnRequests}`);
    console.log(`   * Logs clasificados en: ${result.logsDir}`);
  } catch (error) {
    console.error(`[ERROR] Falla en la ronda #${iteration}:`, error);
  }
}

async function start() {
  console.log(`\n🚀 Iniciando generador automatizado de logs para todas las APIs de FreelancerHub`);
  if (isOnce) {
    console.log(`ℹ Modo: Ejecución única (--once)\n`);
    await executeCycle();
    process.exit(0);
  }

  console.log(`ℹ Modo: Bucle continuo programado cada ${intervalMinutes} minutos (Margen: ${intervalMinutes} min)`);
  console.log(`ℹ Presiona Ctrl+C para detener el proceso en cualquier momento.\n`);

  // Primera ejecución inmediata
  await executeCycle();

  // Programación recurrente cada X minutos (por defecto 5 min)
  const timer = setInterval(async () => {
    await executeCycle();
  }, intervalMs);

  const cleanup = () => {
    console.log('\n🛑 Deteniendo programador de logs...');
    clearInterval(timer);
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

start();
