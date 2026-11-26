/**
 * Reporte histórico de niveles de servicio a partir de logs/sla/*.jsonl.
 *
 * Agrega todas las ejecuciones registradas y muestra por módulo:
 * disponibilidad acumulada, latencia p95, número de fallas y la última falla.
 *
 * Uso: pnpm sla:report            (todos los días)
 *      pnpm sla:report 2026-11-26 (un solo día)
 */
import fs from 'node:fs';
import path from 'node:path';

const LOG_DIR = path.resolve(process.cwd(), 'logs', 'sla');
const day = process.argv[2];

const files = fs.existsSync(LOG_DIR)
    ? fs.readdirSync(LOG_DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f) && (!day || f.startsWith(day)))
    : [];

if (files.length === 0) {
    console.log('No hay logs en logs/sla. Ejecuta primero: pnpm test:sla');
    process.exit(0);
}

interface Row {
    timestamp: string;
    runId: string;
    module: string;
    step: string;
    method: string;
    latencyMs: number;
    result: 'PASS' | 'FAIL';
    error?: string;
}

const rows: Row[] = files.flatMap((f) =>
    fs
        .readFileSync(path.join(LOG_DIR, f), 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Row)
);

const p95 = (values: number[]) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.max(0, Math.ceil(0.95 * sorted.length) - 1)];
};

const runs = new Set(rows.map((r) => r.runId));
console.log(`Ejecuciones: ${runs.size}   Verificaciones: ${rows.length}   Archivos: ${files.join(', ')}\n`);
console.log('MÓDULO         CHECKS  FALLAS  DISPONIB.  P95ms  ÚLTIMA FALLA');

const modules = [...new Set(rows.map((r) => r.module))];
for (const module of modules) {
    const list = rows.filter((r) => r.module === module);
    const fails = list.filter((r) => r.result === 'FAIL');
    const availability = Math.round(((list.length - fails.length) / list.length) * 10000) / 100;
    const latency = p95(list.filter((r) => r.method !== 'ASSERT').map((r) => r.latencyMs));
    const last = fails.at(-1);
    console.log(
        `${module.padEnd(14)} ${String(list.length).padStart(6)} ${String(fails.length).padStart(7)}   ${String(availability).padStart(6)}%  ${String(latency).padStart(5)}  ${last ? `${last.timestamp} ${last.step}: ${last.error}` : '-'}`
    );
}
