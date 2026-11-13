import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createServer, Server as HttpServer } from 'node:http';
import { createApp } from '../src/app.js';
import { prisma } from '../src/infrastructure/persistence/prisma/prisma.client.js';

describe('FREEL-39: API Feed de Proyectos con Filtrado (GET /api/v1/projects)', () => {
    let server: HttpServer;
    let baseUrl: string;
    let testClientId: string;
    let createdProjectIds: string[] = [];

    before(async () => {
        const app = createApp();
        server = createServer(app);
        await new Promise<void>((resolve) => {
            server.listen(0, '127.0.0.1', () => resolve());
        });
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
            baseUrl = `http://127.0.0.1:${addr.port}`;
        } else {
            throw new Error('No se pudo inicializar servidor HTTP para pruebas');
        }

        // Crear o buscar un usuario CLIENT para vincular proyectos de prueba
        let testUser = await prisma.user.findFirst({
            where: { role: 'CLIENT' },
        });

        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    email: `client-test-freel39-${Date.now()}@test.com`,
                    role: 'CLIENT',
                },
            });
        }
        testClientId = testUser.id;

        // Limpiar proyectos de pruebas anteriores con el tag distintivo si existieran
        await prisma.project.deleteMany({
            where: { description: { contains: '[FREEL-39-TEST-FIXTURE]' } },
        });

        // Helper para conectar o crear habilidad por slug y name
        async function ensureSkill(name: string, slug: string, category: string) {
            const existing = await prisma.skill.findFirst({
                where: { OR: [{ slug }, { name }] },
            });
            if (existing) return existing.id;
            const created = await prisma.skill.create({
                data: { name, slug, category },
            });
            return created.id;
        }

        const reactNativeId = await ensureSkill('React Native', 'react-native', 'Mobile');
        const nodejsId = await ensureSkill('Node.js', 'nodejs', 'Backend');
        const postgresqlId = await ensureSkill('PostgreSQL', 'postgresql', 'Database');
        const vuejsId = await ensureSkill('Vue.js', 'vuejs', 'Frontend');
        const pythonId = await ensureSkill('Python', 'python', 'Backend');
        const dockerId = await ensureSkill('Docker', 'docker', 'DevOps');
        const closedSkillId = await ensureSkill('Closed Skill', 'closed-skill', 'General');

        // Sembrar 3 proyectos con distintas características para validar filtros
        const p1 = await prisma.project.create({
            data: {
                clientId: testClientId,
                title: 'E-commerce Móvil con React Native y Node',
                description: 'Desarrollo de aplicación móvil y microservicios [FREEL-39-TEST-FIXTURE]',
                budget: 1500,
                status: 'ACTIVE',
                estimatedDate: new Date('2026-12-01T00:00:00Z'),
                skills: {
                    create: [
                        { skill: { connect: { id: reactNativeId } } },
                        { skill: { connect: { id: nodejsId } } },
                        { skill: { connect: { id: postgresqlId } } },
                    ],
                },
            },
        });

        const p2 = await prisma.project.create({
            data: {
                clientId: testClientId,
                title: 'Plataforma Web SaaS con Vue y Python',
                description: 'Dashboard analítico para monitoreo empresarial [FREEL-39-TEST-FIXTURE]',
                budget: 3500,
                status: 'ACTIVE',
                estimatedDate: new Date('2026-12-15T00:00:00Z'),
                skills: {
                    create: [
                        { skill: { connect: { id: vuejsId } } },
                        { skill: { connect: { id: pythonId } } },
                        { skill: { connect: { id: dockerId } } },
                    ],
                },
            },
        });

        const p3 = await prisma.project.create({
            data: {
                clientId: testClientId,
                title: 'Proyecto Cerrado Inactivo',
                description: 'Este proyecto no debe aparecer en el feed activo [FREEL-39-TEST-FIXTURE]',
                budget: 5000,
                status: 'CLOSED',
                estimatedDate: new Date('2026-11-01T00:00:00Z'),
                skills: {
                    create: [
                        { skill: { connect: { id: closedSkillId } } },
                    ],
                },
            },
        });

        createdProjectIds = [p1.id, p2.id, p3.id];
    });

    after(async () => {
        if (createdProjectIds.length > 0) {
            await prisma.project.deleteMany({
                where: { id: { in: createdProjectIds } },
            });
        }
        await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it('1. Debe responder exitosamente y retornar solo proyectos con status ACTIVE', async () => {
        const res = await fetch(`${baseUrl}/api/v1/projects`);
        assert.equal(res.status, 200);

        const body = (await res.json()) as any;
        assert.equal(body.success, true);
        assert.ok(Array.isArray(body.data));
        assert.ok(body.meta);
        assert.ok(typeof body.meta.total === 'number');
        assert.ok(typeof body.meta.totalPages === 'number');
        assert.ok(typeof body.meta.currentPage === 'number');

        // Verificar que ningún proyecto inactivo/CLOSED esté presente
        const hasClosed = body.data.some((p: any) => p.status === 'CLOSED' || p.id === createdProjectIds[2]);
        assert.equal(hasClosed, false, 'No deben retornarse proyectos con status CLOSED');
    });

    it('2. Debe filtrar por búsqueda (search) en título o descripción', async () => {
        const res = await fetch(`${baseUrl}/api/v1/projects?search=E-commerce`);
        assert.equal(res.status, 200);

        const body = (await res.json()) as any;
        assert.ok(body.data.length >= 1);
        const match = body.data.find((p: any) => p.id === createdProjectIds[0]);
        assert.ok(match, 'Debe encontrar el proyecto E-commerce');
    });

    it('3. Debe filtrar por rango de presupuesto (minBudget y maxBudget)', async () => {
        const res = await fetch(`${baseUrl}/api/v1/projects?minBudget=3000&maxBudget=4000`);
        assert.equal(res.status, 200);

        const body = (await res.json()) as any;
        const match = body.data.find((p: any) => p.id === createdProjectIds[1]);
        assert.ok(match, 'Debe incluir el proyecto con presupuesto de 3500');

        const nonMatch = body.data.find((p: any) => p.id === createdProjectIds[0]);
        assert.equal(nonMatch, undefined, 'No debe incluir el proyecto con presupuesto de 1500');
    });

    it('4. Debe filtrar por habilidades (skills) tanto por string separado por comas como por array', async () => {
        // Formato string separado por comas
        const resComma = await fetch(`${baseUrl}/api/v1/projects?skills=React+Native,PostgreSQL`);
        assert.equal(resComma.status, 200);
        const bodyComma = (await resComma.json()) as any;
        assert.ok(bodyComma.data.some((p: any) => p.id === createdProjectIds[0]));

        // Formato query repetido (array)
        const resArray = await fetch(`${baseUrl}/api/v1/projects?skills=Python&skills=Docker`);
        assert.equal(resArray.status, 200);
        const bodyArray = (await resArray.json()) as any;
        assert.ok(bodyArray.data.some((p: any) => p.id === createdProjectIds[1]));
    });

    it('5. Debe filtrar por categoría (category) de las habilidades vinculadas', async () => {
        const res = await fetch(`${baseUrl}/api/v1/projects?category=Frontend`);
        assert.equal(res.status, 200);
        const body = (await res.json()) as any;
        assert.ok(body.data.some((p: any) => p.id === createdProjectIds[1]));
    });

    it('6. Debe combinar múltiples filtros simultáneamente', async () => {
        const url = `${baseUrl}/api/v1/projects?search=React&minBudget=1000&maxBudget=2000&skills=Node.js&page=1&limit=5`;
        const res = await fetch(url);
        assert.equal(res.status, 200);

        const body = (await res.json()) as any;
        assert.equal(body.meta.limit, 5);
        assert.equal(body.meta.currentPage, 1);
        assert.ok(body.data.some((p: any) => p.id === createdProjectIds[0]));
        assert.equal(body.data.some((p: any) => p.id === createdProjectIds[1]), false);
    });

    it('7. Debe aplicar paginación correctamente con limit y page', async () => {
        const res = await fetch(`${baseUrl}/api/v1/projects?page=1&limit=1`);
        assert.equal(res.status, 200);

        const body = (await res.json()) as any;
        assert.equal(body.meta.limit, 1);
        assert.equal(body.meta.currentPage, 1);
        assert.ok(body.meta.total >= 2);
        assert.ok(body.meta.totalPages >= 2);
        assert.equal(body.data.length, 1);
    });
});
