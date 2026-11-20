import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { Container } from '../src/container.js';

export interface RunAllApisResult {
  totalRequests: number;
  successfulRequests: number;
  warnRequests: number;
  logsDir: string;
  todayFolder: string;
  durationMs: number;
  endpointsTested: string[];
}

/**
 * Ejecuta una ráfaga automatizada de peticiones HTTP reales contra todas las APIs
 * para disparar el middleware y los controladores, generando los logs estandarizados.
 */
export async function runAllApisFlow(): Promise<RunAllApisResult> {
  const startTime = Date.now();
  const app = createApp();
  const httpServer = createServer(app);

  await new Promise<void>((resolve) => {
    httpServer.listen(0, '127.0.0.1', () => resolve());
  });

  const address = httpServer.address();
  const port = typeof address === 'object' && address ? address.port : 3000;
  const baseUrl = `http://127.0.0.1:${port}`;

  const endpointsTested: string[] = [];
  let successfulRequests = 0;
  let warnRequests = 0;

  try {
    const unique = Date.now().toString().slice(-6);
    const clientEmail = `client_${unique}@freelancerhub.org`;
    const freelancerEmail = `freelancer_${unique}@freelancerhub.org`;

    // 1. Registro de Cliente
    let clientToken = '';
    let clientUserId = '';
    const regClientRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: clientEmail,
        password: 'Password123!',
        fullName: `Cliente Test ${unique}`,
        role: 'CLIENT',
      }),
    });
    endpointsTested.push('POST /api/v1/auth/register (CLIENT)');
    if (regClientRes.status === 201) {
      successfulRequests++;
      const data: any = await regClientRes.json();
      clientToken = data.data.accessToken;
      clientUserId = data.data.user.id;
    } else {
      clientUserId = `usr_cli_${unique}`;
      clientToken = Container.jwtTokenGenerator.generateAccessToken({
        sub: clientUserId,
        email: clientEmail,
        role: 'CLIENT',
        isVerified: true,
      });
    }

    // 2. Registro de Freelancer
    let freeToken = '';
    let freeUserId = '';
    const regFreeRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: freelancerEmail,
        password: 'Password123!',
        fullName: `Freelancer Test ${unique}`,
        role: 'FREELANCER',
      }),
    });
    endpointsTested.push('POST /api/v1/auth/register (FREELANCER)');
    if (regFreeRes.status === 201) {
      successfulRequests++;
      const data: any = await regFreeRes.json();
      freeToken = data.data.accessToken;
      freeUserId = data.data.user.id;
    } else {
      freeUserId = `usr_fre_${unique}`;
      freeToken = Container.jwtTokenGenerator.generateAccessToken({
        sub: freeUserId,
        email: freelancerEmail,
        role: 'FREELANCER',
        isVerified: true,
      });
    }

    // 3. Login
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: clientEmail,
        password: 'Password123!',
      }),
    });
    endpointsTested.push('POST /api/v1/auth/login');
    if (loginRes.ok) successfulRequests++;

    // 4. Perfil del usuario autenticado (Auth me)
    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    endpointsTested.push('GET /api/v1/auth/me');
    if (meRes.ok) successfulRequests++;

    // 5. Crear Convocatoria de Proyecto
    let projectId = '';
    const createProjRes = await fetch(`${baseUrl}/api/v1/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        title: `E-commerce Marketplace ${unique}`,
        description: 'Construcción integral de plataforma con pagos Escrow y chat en tiempo real.',
        category: 'DEVELOPMENT',
        budget: 18000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      }),
    });
    endpointsTested.push('POST /api/v1/projects');
    if (createProjRes.status === 201) {
      successfulRequests++;
      const projData: any = await createProjRes.json();
      projectId = projData.data.id;
    }

    // 6. Consultar Feed de Proyectos
    const getProjectsRes = await fetch(`${baseUrl}/api/v1/projects?category=DEVELOPMENT&limit=5`);
    endpointsTested.push('GET /api/v1/projects');
    if (getProjectsRes.ok) successfulRequests++;

    // 7. Postular Propuesta si el proyecto fue creado
    let proposalId = '';
    if (projectId) {
      const submitPropRes = await fetch(`${baseUrl}/api/v1/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${freeToken}`,
        },
        body: JSON.stringify({
          projectId,
          coverLetter: 'Cuento con amplia experiencia en arquitectura limpia y pasarelas de pago.',
          totalPrice: 16500,
          estimatedDays: 25,
          milestones: [
            { title: 'Hito 1: Backend y Base de Datos', description: 'Prisma y PostgreSQL', amount: 6500, deliveryDays: 7, order: 1 },
            { title: 'Hito 2: Frontend React y Móvil', description: 'Pantallas y navegación', amount: 10000, deliveryDays: 18, order: 2 },
          ],
        }),
      });
      endpointsTested.push('POST /api/v1/proposals');
      if (submitPropRes.status === 201) {
        successfulRequests++;
        const propData: any = await submitPropRes.json();
        proposalId = propData.data.id;
      }

      // 8. Consultar propuestas del proyecto
      const getPropsRes = await fetch(`${baseUrl}/api/v1/proposals/project/${projectId}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      endpointsTested.push('GET /api/v1/proposals/project/:projectId');
      if (getPropsRes.ok) successfulRequests++;
    }

    // 9. Crear Contrato Escrow a partir de la propuesta
    let contractId = '';
    if (proposalId) {
      const createContractRes = await fetch(`${baseUrl}/api/v1/contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientToken}`,
        },
        body: JSON.stringify({ proposalId }),
      });
      endpointsTested.push('POST /api/v1/contracts');
      if (createContractRes.status === 201) {
        successfulRequests++;
        const contractData: any = await createContractRes.json();
        contractId = contractData.data.id;
      }
    }

    // 10. Fondear Contrato Escrow y avanzar estado
    if (contractId) {
      const fundRes = await fetch(`${baseUrl}/api/v1/contracts/${contractId}/fund`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      endpointsTested.push('POST /api/v1/contracts/:id/fund');
      if (fundRes.ok) successfulRequests++;

      const progressRes = await fetch(`${baseUrl}/api/v1/contracts/${contractId}/progress`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      endpointsTested.push('POST /api/v1/contracts/:id/progress');
      if (progressRes.ok) successfulRequests++;

      const getContractRes = await fetch(`${baseUrl}/api/v1/contracts/${contractId}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      endpointsTested.push('GET /api/v1/contracts/:id');
      if (getContractRes.ok) successfulRequests++;
    }

    // 11. Billetera Digital: Abono y Consulta
    const depositRes = await fetch(`${baseUrl}/api/v1/wallet/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({ amount: 5000, description: 'Fondeo de prueba automatizada' }),
    });
    endpointsTested.push('POST /api/v1/wallet/deposit');
    if (depositRes.ok) successfulRequests++;

    const getWalletRes = await fetch(`${baseUrl}/api/v1/wallet`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    endpointsTested.push('GET /api/v1/wallet');
    if (getWalletRes.ok) successfulRequests++;

    // 12. Mensajería Chat
    const chatInitRes = await fetch(`${baseUrl}/api/v1/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        peerId: freeUserId,
        projectId: projectId || undefined,
      }),
    });
    endpointsTested.push('POST /api/v1/chats');
    let conversationId = '';
    if (chatInitRes.ok) {
      successfulRequests++;
      const chatData: any = await chatInitRes.json();
      conversationId = chatData.data?.id;
    }

    if (conversationId) {
      const sendMsgRes = await fetch(`${baseUrl}/api/v1/chats/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientToken}`,
        },
        body: JSON.stringify({ content: 'Hola! Notificación de hito fondeado en Escrow.' }),
      });
      endpointsTested.push('POST /api/v1/chats/:conversationId/messages');
      if (sendMsgRes.ok) successfulRequests++;

      const readRes = await fetch(`${baseUrl}/api/v1/chats/${conversationId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${freeToken}` },
      });
      endpointsTested.push('PATCH /api/v1/chats/:conversationId/read');
      if (readRes.ok) successfulRequests++;
    }

    // 13. Catálogo Global de Skills
    const skillsRes = await fetch(`${baseUrl}/api/v1/skills`);
    endpointsTested.push('GET /api/v1/skills');
    if (skillsRes.ok) successfulRequests++;

    // 14. Perfil y Onboarding
    const onboardingRes = await fetch(`${baseUrl}/api/v1/profile/onboarding-status`, {
      headers: { Authorization: `Bearer ${freeToken}` },
    });
    endpointsTested.push('GET /api/v1/profile/onboarding-status');
    if (onboardingRes.ok) successfulRequests++;

    const updateProfileRes = await fetch(`${baseUrl}/api/v1/users/me/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freeToken}`,
      },
      body: JSON.stringify({
        professionalTitle: 'Lead Software Architect',
        bio: 'Especialista en backend escalable y microservicios.',
        location: 'México',
      }),
    });
    endpointsTested.push('PUT /api/v1/users/me/profile');
    if (updateProfileRes.ok) successfulRequests++;

    // 15. Tareas Internas (Tablero)
    const taskRes = await fetch(`${baseUrl}/api/v1/internal/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Auditoría Logs Sprint ${unique}`,
        assignee: 'Christian',
        priority: 'HIGH',
      }),
    });
    endpointsTested.push('POST /api/v1/internal/tasks');
    if (taskRes.status === 201) successfulRequests++;

    // 16. Inyecciones de Seguridad y Validación Intencionales (Alimentan warn.log)
    // 16.1 Sin token (401)
    const unauthRes = await fetch(`${baseUrl}/api/v1/auth/me`);
    endpointsTested.push('GET /api/v1/auth/me (401 Sin Token -> warn.log)');
    if (unauthRes.status === 401) warnRequests++;

    // 16.2 Rol prohibido: Freelancer creando proyecto (403)
    const forbidRes = await fetch(`${baseUrl}/api/v1/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freeToken}`,
      },
      body: JSON.stringify({
        title: 'Proyecto no autorizado',
        category: 'DEVELOPMENT',
        budget: 1000,
        deadline: new Date().toISOString(),
      }),
    });
    endpointsTested.push('POST /api/v1/projects (403 Rol Prohibido -> warn.log)');
    if (forbidRes.status === 403) warnRequests++;

    // 16.3 Validación Zod fallida en Login (400)
    const badReqRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'correo-invalido' }),
    });
    endpointsTested.push('POST /api/v1/auth/login (400 Zod Invalido -> warn.log)');
    if (badReqRes.status === 400) warnRequests++;

  } finally {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  }

  const durationMs = Date.now() - startTime;
  const todayFolder = new Date().toISOString().substring(0, 10);
  const logsDir = path.join(process.cwd(), 'logs', todayFolder);

  return {
    totalRequests: endpointsTested.length,
    successfulRequests,
    warnRequests,
    logsDir,
    todayFolder,
    durationMs,
    endpointsTested,
  };
}
