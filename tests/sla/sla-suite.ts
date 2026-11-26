/**
 * Suite automática de disponibilidad y funcionalidad de FreelancerHub.
 *
 * Ejecuta contra una instancia real (local o desplegada):
 *   1. Disponibilidad: cada módulo responde y con el código esperado.
 *   2. Funcionalidad: recorre el flujo de negocio completo
 *      registro -> convocatoria -> propuesta -> contrato -> método de pago -> fondeo Escrow
 *      -> entrega -> aprobación/liberación -> reseñas -> chat -> billetera.
 *
 * Cada verificación se registra como una línea JSON en logs/sla/YYYY-MM-DD.jsonl
 * (timestamp, suite, módulo, paso, método, ruta, status, latencia, resultado).
 * Al final se calcula por módulo: disponibilidad (%), latencia p50/p95 y tasa de error,
 * y se compara contra los objetivos de nivel de servicio (SLO) definidos abajo.
 *
 * Uso:
 *   pnpm test:sla                          # contra http://localhost:4000/api
 *   API_URL=https://api.freelancerhub.org/api WEB_URL=https://freelancerhub.org pnpm test:sla
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const API = (process.env.API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const WEB = process.env.WEB_URL || 'http://localhost:5173';
const RUN_ID = randomUUID().slice(0, 8);
const LOG_DIR = path.resolve(process.cwd(), 'logs', 'sla');
const DAY = new Date().toISOString().slice(0, 10);
const LOG_FILE = path.join(LOG_DIR, `${DAY}.jsonl`);
const SUMMARY_FILE = path.join(LOG_DIR, `summary-${DAY}.jsonl`);

/** Objetivos de nivel de servicio por verificación. */
const SLO = {
    availabilityPct: 99,
    latencyP95Ms: 800,
};

type Suite = 'AVAILABILITY' | 'FUNCTIONAL';

interface CheckRecord {
    timestamp: string;
    runId: string;
    suite: Suite;
    module: string;
    step: string;
    method: string;
    path: string;
    status: number;
    expected: number[];
    latencyMs: number;
    result: 'PASS' | 'FAIL';
    error?: string;
}

const records: CheckRecord[] = [];

fs.mkdirSync(LOG_DIR, { recursive: true });

function log(record: CheckRecord): void {
    records.push(record);
    fs.appendFileSync(LOG_FILE, `${JSON.stringify(record)}\n`, 'utf8');
    const mark = record.result === 'PASS' ? 'PASS' : 'FAIL';
    const extra = record.error ? `  -> ${record.error}` : '';
    console.log(
        `[${mark}] ${record.suite.padEnd(12)} ${record.module.padEnd(14)} ${record.step.padEnd(42)} ${String(record.status).padEnd(4)} ${String(record.latencyMs).padStart(5)}ms${extra}`
    );
}

interface CallOptions {
    suite: Suite;
    module: string;
    step: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    token?: string;
    body?: unknown;
    expected: number[];
}

/** Ejecuta una petición, mide latencia y registra el resultado. Devuelve el JSON de respuesta. */
async function call(opts: CallOptions): Promise<any> {
    const method = opts.method ?? 'GET';
    const started = performance.now();
    let status = 0;
    let json: any = null;
    let error: string | undefined;

    try {
        const res = await fetch(opts.url, {
            method,
            headers: {
                ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
                ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
            },
            body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
            signal: AbortSignal.timeout(10_000),
        });
        status = res.status;
        const text = await res.text();
        try {
            json = text ? JSON.parse(text) : null;
        } catch {
            json = null;
        }
        if (!opts.expected.includes(status)) {
            error = json?.message || `status inesperado ${status}`;
        }
    } catch (err) {
        error = err instanceof Error ? err.message : String(err);
    }

    const latencyMs = Math.round(performance.now() - started);
    log({
        timestamp: new Date().toISOString(),
        runId: RUN_ID,
        suite: opts.suite,
        module: opts.module,
        step: opts.step,
        method,
        path: opts.url.replace(API, '').replace(WEB, '[web]') || '/',
        status,
        expected: opts.expected,
        latencyMs,
        result: error ? 'FAIL' : 'PASS',
        ...(error ? { error } : {}),
    });

    if (error) {
        throw new Error(`${opts.module}/${opts.step}: ${error}`);
    }
    return json;
}

/** Registra una verificación lógica (sin petición HTTP), p. ej. un saldo esperado. */
function assertStep(module: string, step: string, condition: boolean, detail: string): void {
    log({
        timestamp: new Date().toISOString(),
        runId: RUN_ID,
        suite: 'FUNCTIONAL',
        module,
        step,
        method: 'ASSERT',
        path: '-',
        status: condition ? 200 : 0,
        expected: [200],
        latencyMs: 0,
        result: condition ? 'PASS' : 'FAIL',
        ...(condition ? {} : { error: detail }),
    });
    if (!condition) throw new Error(`${module}/${step}: ${detail}`);
}

async function availabilitySuite(): Promise<void> {
    const A: Suite = 'AVAILABILITY';
    const checks: Omit<CallOptions, 'suite'>[] = [
        { module: 'HEALTH', step: 'API y base de datos arriba', url: `${API}/health`, expected: [200] },
        { module: 'FRONTEND', step: 'Aplicación web carga', url: WEB, expected: [200] },
        { module: 'PROJECTS', step: 'Feed público de convocatorias', url: `${API}/v1/projects`, expected: [200] },
        { module: 'SKILLS', step: 'Catálogo de habilidades', url: `${API}/v1/skills`, expected: [200, 401] },
        { module: 'AUTH', step: 'Login rechaza credenciales inválidas', method: 'POST', url: `${API}/v1/auth/login`, body: { email: 'sonda@freelancerhub.test', password: 'Invalida123' }, expected: [401] },
        { module: 'PROPOSALS', step: 'Ruta protegida exige token', url: `${API}/v1/proposals/me`, expected: [401] },
        { module: 'CONTRACTS', step: 'Ruta protegida exige token', url: `${API}/v1/contracts`, expected: [401] },
        { module: 'WALLET', step: 'Ruta protegida exige token', url: `${API}/v1/wallet`, expected: [401] },
        { module: 'PAYMENTS', step: 'Ruta protegida exige token', url: `${API}/v1/payment-methods`, expected: [401] },
        { module: 'CHAT', step: 'Ruta protegida exige token', url: `${API}/v1/chats`, expected: [401] },
        { module: 'REVIEWS', step: 'Ruta protegida exige token', method: 'POST', url: `${API}/v1/reviews`, body: {}, expected: [401] },
    ];
    for (const c of checks) {
        await call({ suite: A, ...c }).catch(() => undefined);
    }
}

async function register(role: 'CLIENT' | 'FREELANCER') {
    const email = `sla-${role.toLowerCase()}-${RUN_ID}-${randomUUID().slice(0, 4)}@freelancerhub.test`;
    const password = 'PruebaSla123';
    const res = await call({
        suite: 'FUNCTIONAL',
        module: 'AUTH',
        step: `Registro ${role}`,
        method: 'POST',
        url: `${API}/v1/auth/register`,
        body: { fullName: `Prueba SLA ${role === 'CLIENT' ? 'Cliente' : 'Freelancer'}`, email, password, role },
        expected: [201],
    });
    return {
        token: res.data.accessToken as string,
        userId: res.data.user.id as string,
        email,
        password,
    };
}

async function functionalSuite(): Promise<void> {
    const F: Suite = 'FUNCTIONAL';

    const client = await register('CLIENT');
    const freelancer = await register('FREELANCER');
    await call({ suite: F, module: 'AUTH', step: 'Login con credenciales válidas', method: 'POST', url: `${API}/v1/auth/login`, body: { email: client.email, password: client.password }, expected: [200] });

    await call({ suite: F, module: 'AUTH', step: 'Rol FREELANCER no puede crear convocatoria', method: 'POST', url: `${API}/v1/projects`, token: freelancer.token, body: {}, expected: [400, 403] });

    const estimated = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    const project = await call({
        suite: F, module: 'PROJECTS', step: 'Cliente publica convocatoria', method: 'POST',
        url: `${API}/v1/projects`, token: client.token,
        body: {
            title: `Prueba SLA ${RUN_ID} tienda en linea`,
            description: 'Convocatoria generada por la suite automatica de niveles de servicio de FreelancerHub.',
            budget: 10000,
            skills: ['React', 'Node.js', 'PostgreSQL'],
            estimatedDate: estimated,
        },
        expected: [201],
    });
    const projectId: string = project.data.id;

    const proposal = await call({
        suite: F, module: 'PROPOSALS', step: 'Freelancer envía propuesta por hitos', method: 'POST',
        url: `${API}/v1/proposals`, token: freelancer.token,
        body: {
            projectId,
            coverLetter: 'Propuesta generada por la suite automatica para validar el flujo completo.',
            totalPrice: 8000,
            estimatedDays: 20,
            milestones: [
                { title: 'Diseño y maquetado', amount: 3000, deliveryDays: 7, order: 1 },
                { title: 'Integración y despliegue', amount: 5000, deliveryDays: 13, order: 2 },
            ],
        },
        expected: [201],
    });
    const proposalId: string = proposal.data.id;

    await call({ suite: F, module: 'PROPOSALS', step: 'Propuesta duplicada se rechaza', method: 'POST', url: `${API}/v1/proposals`, token: freelancer.token, body: { projectId, coverLetter: 'Segunda propuesta para la misma convocatoria de prueba.', totalPrice: 100, estimatedDays: 1, milestones: [{ title: 'Unico hito', amount: 100, deliveryDays: 1, order: 1 }] }, expected: [409] });
    await call({ suite: F, module: 'PROPOSALS', step: 'Cliente lista propuestas de su convocatoria', url: `${API}/v1/proposals/project/${projectId}`, token: client.token, expected: [200] });

    const contract = await call({ suite: F, module: 'CONTRACTS', step: 'Cliente formaliza contrato (DRAFT)', method: 'POST', url: `${API}/v1/contracts`, token: client.token, body: { proposalId }, expected: [201] });
    const contractId: string = contract.data.id;
    const milestones: { id: string }[] = contract.data.milestones;

    const closed = await call({ suite: F, module: 'PROJECTS', step: 'Convocatoria pasa a CLOSED', url: `${API}/v1/projects/${projectId}`, token: client.token, expected: [200] });
    assertStep('PROJECTS', 'Estado de convocatoria = CLOSED', closed.data.status === 'CLOSED', `estado=${closed.data.status}`);

    await call({ suite: F, module: 'MILESTONES', step: 'No se aprueba hito sin fondos', method: 'POST', url: `${API}/v1/milestones/${milestones[0].id}/approve`, token: client.token, expected: [403, 409] });

    await call({
        suite: F, module: 'PAYMENTS', step: 'Cliente registra tarjeta tokenizada', method: 'POST',
        url: `${API}/v1/payment-methods`, token: client.token,
        body: { gatewayToken: `tok_visa_sla_${RUN_ID}`, cardBrand: 'visa', last4: '4242', expMonth: 12, expYear: new Date().getFullYear() + 3, isDefault: true },
        expected: [201],
    });

    const funded = await call({ suite: F, module: 'ESCROW', step: 'Cliente fondea custodia Escrow', method: 'POST', url: `${API}/v1/contracts/${contractId}/fund`, token: client.token, body: { paymentMethod: 'card', cardLast4: '4242' }, expected: [200] });
    assertStep('ESCROW', 'Contrato IN_PROGRESS con escrow = total', funded.data.status === 'IN_PROGRESS' && Number(funded.data.escrowBalance) === 8000, `estado=${funded.data.status} escrow=${funded.data.escrowBalance}`);

    await call({ suite: F, module: 'CONTRACTS', step: 'Tercero no puede ver el contrato', url: `${API}/v1/contracts/${contractId}`, token: (await register('CLIENT')).token, expected: [403] });

    for (const [i, m] of milestones.entries()) {
        await call({ suite: F, module: 'MILESTONES', step: `Hito ${i + 1}: freelancer entrega`, method: 'POST', url: `${API}/v1/milestones/${m.id}/deliveries`, token: freelancer.token, body: { notes: 'Entrega automatica de prueba' }, expected: [200, 201] });
        await call({ suite: F, module: 'MILESTONES', step: `Hito ${i + 1}: cliente aprueba y libera pago`, method: 'POST', url: `${API}/v1/milestones/${m.id}/approve`, token: client.token, expected: [200] });
    }
    await call({ suite: F, module: 'MILESTONES', step: 'Doble aprobación se rechaza', method: 'POST', url: `${API}/v1/milestones/${milestones[0].id}/approve`, token: client.token, expected: [409] });

    const finalContract = await call({ suite: F, module: 'CONTRACTS', step: 'Consulta de contrato finalizado', url: `${API}/v1/contracts/${contractId}`, token: client.token, expected: [200] });
    assertStep('CONTRACTS', 'Contrato COMPLETED con escrow = 0', finalContract.data.status === 'COMPLETED' && Number(finalContract.data.escrowBalance) === 0, `estado=${finalContract.data.status} escrow=${finalContract.data.escrowBalance}`);

    const wallet = await call({ suite: F, module: 'WALLET', step: 'Billetera del freelancer', url: `${API}/v1/wallet`, token: freelancer.token, expected: [200] });
    assertStep('WALLET', 'Freelancer recibió 8000 - 10% comisión = 7200', Number(wallet.data.availableBalance) === 7200, `saldo=${wallet.data.availableBalance}`);

    await call({ suite: F, module: 'REVIEWS', step: 'Cliente califica (reseña ciega)', method: 'POST', url: `${API}/v1/reviews`, token: client.token, body: { contractId, rating: 5, comment: 'Excelente trabajo en la prueba automatica.' }, expected: [201] });
    const hidden = await call({ suite: F, module: 'REVIEWS', step: 'Freelancer aún no ve reseña del cliente', url: `${API}/v1/reviews/contract/${contractId}`, token: freelancer.token, expected: [200] });
    assertStep('REVIEWS', 'Reseña oculta hasta que ambos califiquen', hidden.data.length === 0, `visibles=${hidden.data.length}`);
    await call({ suite: F, module: 'REVIEWS', step: 'Freelancer califica', method: 'POST', url: `${API}/v1/reviews`, token: freelancer.token, body: { contractId, rating: 5, comment: 'Cliente claro y pagos puntuales.' }, expected: [201] });
    const both = await call({ suite: F, module: 'REVIEWS', step: 'Ambas reseñas publicadas', url: `${API}/v1/reviews/contract/${contractId}`, token: freelancer.token, expected: [200] });
    assertStep('REVIEWS', 'Se publican las 2 reseñas', both.data.length === 2, `visibles=${both.data.length}`);

    const conv = await call({ suite: F, module: 'CHAT', step: 'Cliente abre conversación con freelancer', method: 'POST', url: `${API}/v1/chats`, token: client.token, body: { peerId: freelancer.userId, projectId }, expected: [200, 201] });
    const conversationId: string = conv.data?.id ?? conv.data?.conversation?.id;
    await call({ suite: F, module: 'CHAT', step: 'Envío de mensaje', method: 'POST', url: `${API}/v1/chats/${conversationId}/messages`, token: client.token, body: { content: 'Mensaje de prueba automatica' }, expected: [200, 201] });
    await call({ suite: F, module: 'CHAT', step: 'Freelancer lee mensajes', url: `${API}/v1/chats/${conversationId}/messages`, token: freelancer.token, expected: [200] });
}

function percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
    return sorted[Math.max(0, idx)];
}

function summarize(): boolean {
    const byModule = new Map<string, CheckRecord[]>();
    for (const r of records) {
        if (!byModule.has(r.module)) byModule.set(r.module, []);
        byModule.get(r.module)!.push(r);
    }

    console.log('\nResumen por módulo (objetivo: disponibilidad >= %d%%, p95 <= %dms)', SLO.availabilityPct, SLO.latencyP95Ms);
    console.log('MÓDULO         CHECKS  OK   DISPONIB.  P50ms  P95ms  SLO');
    let allMet = true;
    for (const [module, list] of byModule) {
        const http = list.filter((r) => r.method !== 'ASSERT');
        const passed = list.filter((r) => r.result === 'PASS').length;
        const availability = Math.round((passed / list.length) * 10000) / 100;
        const latencies = http.map((r) => r.latencyMs);
        const p50 = percentile(latencies, 50);
        const p95 = percentile(latencies, 95);
        const met = availability >= SLO.availabilityPct && p95 <= SLO.latencyP95Ms;
        allMet &&= met;

        console.log(
            `${module.padEnd(14)} ${String(list.length).padStart(6)} ${String(passed).padStart(4)}   ${String(availability).padStart(6)}%  ${String(p50).padStart(5)}  ${String(p95).padStart(5)}  ${met ? 'CUMPLE' : 'NO CUMPLE'}`
        );
        fs.appendFileSync(
            SUMMARY_FILE,
            `${JSON.stringify({ timestamp: new Date().toISOString(), runId: RUN_ID, module, checks: list.length, passed, availabilityPct: availability, latencyP50Ms: p50, latencyP95Ms: p95, sloMet: met })}\n`,
            'utf8'
        );
    }

    const failed = records.filter((r) => r.result === 'FAIL').length;
    console.log(`\nRun ${RUN_ID}: ${records.length - failed}/${records.length} verificaciones OK. Logs: ${path.relative(process.cwd(), LOG_FILE)}`);
    return failed === 0 && allMet;
}

async function main(): Promise<void> {
    console.log(`FreelancerHub SLA suite  run=${RUN_ID}  api=${API}  web=${WEB}\n`);
    await availabilitySuite();
    try {
        await functionalSuite();
    } catch (err) {
        console.error(`\nFlujo funcional detenido: ${err instanceof Error ? err.message : String(err)}`);
    }
    const ok = summarize();
    process.exitCode = ok ? 0 : 1;
}

main();
