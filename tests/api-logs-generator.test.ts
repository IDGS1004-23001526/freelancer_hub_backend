import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { runAllApisFlow } from '../scripts/generate-api-logs-core.js';

describe('Prueba Automatizada E2E de APIs: Generación de Logs con Margen de 5 Minutos', () => {
  it('Debe invocar todas las APIs y verificar logs clasificados con margen temporal <= 5 minutos', async () => {
    const testStartTime = Date.now();
    const result = await runAllApisFlow();

    assert.ok(result.totalRequests >= 15, `Se debieron probar al menos 15 endpoints (probados: ${result.totalRequests})`);
    assert.ok(result.warnRequests >= 2, `Se debieron capturar al menos 2 advertencias de seguridad/validación (capturadas: ${result.warnRequests})`);

    const dayDir = result.logsDir;
    assert.ok(fs.existsSync(dayDir), `El directorio de logs del día debe existir: ${dayDir}`);

    const expectedFiles = [
      'combined.log',
      'business.log',
      'chat.log',
      'warn.log',
      'http.log',
    ];

    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const now = Date.now();

    for (const fileName of expectedFiles) {
      const filePath = path.join(dayDir, fileName);
      assert.ok(fs.existsSync(filePath), `El archivo ${fileName} debe existir en ${dayDir}`);

      const rawContent = fs.readFileSync(filePath, 'utf8').trim();
      assert.ok(rawContent.length > 0, `El archivo ${fileName} no debe estar vacío`);

      const lines = rawContent.split('\n').filter(Boolean);
      assert.ok(lines.length > 0, `El archivo ${fileName} debe contener al menos 1 línea`);

      // Verificar que las líneas generadas en esta ejecución tengan un timestamp dentro del margen de 5 minutos
      let validTimestampsCount = 0;
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          assert.ok(entry.timestamp, `La línea en ${fileName} debe tener timestamp`);
          assert.ok(entry.level, `La línea en ${fileName} debe tener level`);
          assert.ok(entry.message, `La línea en ${fileName} debe tener message`);

          const logTime = new Date(entry.timestamp).getTime();
          const ageMs = now - logTime;

          // Aserción del margen de 5 minutos
          if (ageMs <= FIVE_MINUTES_MS && logTime >= testStartTime - 60000) {
            validTimestampsCount++;
          }
        } catch {
          // Ignorar líneas no parseables si hubiera trailing
        }
      }

      assert.ok(
        validTimestampsCount > 0,
        `El archivo ${fileName} debe contener registros con timestamp dentro del margen de los últimos 5 minutos`
      );
    }

    console.log(`\n======================================================`);
    console.log(`[OK] Verificación E2E de Logs generados exitosamente`);
    console.log(`   * Total de APIs probadas: ${result.totalRequests}`);
    console.log(`   * Peticiones exitosas: ${result.successfulRequests}`);
    console.log(`   * Alertas capturadas (400, 401, 403): ${result.warnRequests}`);
    console.log(`   * Duración total de la ráfaga: ${result.durationMs}ms`);
    console.log(`   * Margen temporal auditado: <= 5 minutos`);
    console.log(`   * Directorio verificado: ${dayDir}`);
    for (const fileName of expectedFiles) {
      const filePath = path.join(dayDir, fileName);
      const count = fs.readFileSync(filePath, 'utf8').trim().split('\n').filter(Boolean).length;
      console.log(`     -> ${fileName.padEnd(14)}: ${count} registros totales`);
    }
    console.log(`======================================================\n`);
  });
});
