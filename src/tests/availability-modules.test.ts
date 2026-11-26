import fs from 'node:fs';
import path from 'node:path';

interface CheckSpec {
    module: string;
    url: string;
    method: 'GET' | 'POST';
    body?: Record<string, unknown>;
    expectedStatuses: number[];
}

const API_BASE = process.env.API_URL || 'https://api.freelancerhub.org/api/v1';
const WEB_BASE = process.env.WEB_URL || 'https://freelancerhub.org';
const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'availability.log');

const checks: CheckSpec[] = [
    {
        module: 'FRONTEND_WEB',
        url: WEB_BASE,
        method: 'GET',
        expectedStatuses: [200],
    },
    {
        module: 'PROJECTS_API',
        url: `${API_BASE}/projects`,
        method: 'GET',
        expectedStatuses: [200],
    },
    {
        module: 'AUTH_API',
        url: `${API_BASE}/auth/login`,
        method: 'POST',
        body: { email: 'probe@invalid.local', password: 'invalid' },
        expectedStatuses: [400, 401],
    },
    {
        module: 'PROPOSALS_GUARD',
        url: `${API_BASE}/proposals/project/00000000-0000-0000-0000-000000000000`,
        method: 'GET',
        expectedStatuses: [401],
    },
    {
        module: 'CHATS_GUARD',
        url: `${API_BASE}/chats`,
        method: 'GET',
        expectedStatuses: [401],
    },
];

async function runAvailabilityChecks(): Promise<void> {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    let failed = 0;

    for (const check of checks) {
        const start = Date.now();
        let status = 0;
        let ok = false;
        let detail = '';

        try {
            const response = await fetch(check.url, {
                method: check.method,
                headers: check.body ? { 'Content-Type': 'application/json' } : undefined,
                body: check.body ? JSON.stringify(check.body) : undefined,
            });
            status = response.status;
            ok = check.expectedStatuses.includes(status);
            if (!ok) {
                detail = ` expected=${check.expectedStatuses.join('|')}`;
            }
        } catch (error) {
            detail = ` error=${error instanceof Error ? error.message : String(error)}`;
        }

        const latencyMs = Date.now() - start;
        const level = ok ? 'INFO' : 'ERROR';
        const result = ok ? 'OK' : 'FAIL';
        const line = `[${new Date().toISOString()}] [${level}] [${check.module}] ${check.method} ${check.url} status=${status} latency=${latencyMs}ms result=${result}${detail}`;

        console.log(line);
        fs.appendFileSync(LOG_FILE, `${line}\n`, 'utf8');

        if (!ok) {
            failed += 1;
        }
    }

    if (failed > 0) {
        process.exitCode = 1;
    }
}

runAvailabilityChecks();
