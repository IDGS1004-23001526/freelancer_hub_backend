import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/infrastructure/persistence/prisma/prisma.client.js';

async function seed() {
    console.log('Iniciando seed de datos para prueba de Entregables y Escrow...');

    const passwordHash = await bcrypt.hash('Password123!', 10);
    const now = new Date();

    // 1. Crear o reutilizar Cliente
    const client = await prisma.user.upsert({
        where: { email: 'cliente@estudio.com' },
        update: { passwordHash, role: 'CLIENT', isActive: true },
        create: {
            id: randomUUID(),
            email: 'cliente@estudio.com',
            passwordHash,
            role: 'CLIENT',
            isActive: true,
            isEmailVerified: true,
            profile: {
                create: {
                    firstName: 'Sofía',
                    lastName: 'Ramírez',
                    professionalTitle: 'Directora de Tecnología • Estudio Nexus',
                    bio: 'Cliente corporativo contratando desarrollo fintech.',
                },
            },
        },
    });

    // 2. Crear o reutilizar Freelancer
    const freelancer = await prisma.user.upsert({
        where: { email: 'mateo@freelancerhub.org' },
        update: { passwordHash, role: 'FREELANCER', isActive: true },
        create: {
            id: randomUUID(),
            email: 'mateo@freelancerhub.org',
            passwordHash,
            role: 'FREELANCER',
            isActive: true,
            isEmailVerified: true,
            profile: {
                create: {
                    firstName: 'Mateo',
                    lastName: 'Villalobos',
                    professionalTitle: 'Arquitecto Full-Stack & Especialista Fintech',
                    bio: 'Desarrollador senior con experiencia en plataformas transaccionales.',
                    hourlyRate: 60,
                },
            },
        },
    });

    // 3. Crear Billeteras
    await prisma.wallet.upsert({
        where: { userId: client.id },
        update: { availableBalance: 15000, escrowLocked: 2800 },
        create: {
            id: randomUUID(),
            userId: client.id,
            availableBalance: 15000,
            escrowLocked: 2800,
            currency: 'USD',
        },
    });

    await prisma.wallet.upsert({
        where: { userId: freelancer.id },
        update: { availableBalance: 1400, escrowLocked: 0 },
        create: {
            id: randomUUID(),
            userId: freelancer.id,
            availableBalance: 1400,
            escrowLocked: 0,
            currency: 'USD',
        },
    });

    // 4. Crear Proyecto
    const project = await prisma.project.create({
        data: {
            id: randomUUID(),
            clientId: client.id,
            title: 'Plataforma E-Commerce B2B con Pagos en Custodia',
            description: 'Desarrollo de plataforma transaccional B2B con custodia Escrow y entrega de hitos verificados.',
            budget: 4200,
            estimatedDate: new Date('2027-12-31'),
            status: 'ACTIVE',
        },
    });

    // 5. Crear Propuesta aceptada
    const proposal = await prisma.proposal.create({
        data: {
            id: randomUUID(),
            projectId: project.id,
            freelancerId: freelancer.id,
            coverLetter: 'Propuesta completa dividida en 3 hitos de entrega técnica.',
            totalPrice: 4200,
            estimatedDays: 28,
            status: 'ACCEPTED',
        },
    });

    // 6. Crear Contrato en estado IN_PROGRESS
    const contract = await prisma.contract.create({
        data: {
            id: randomUUID(),
            projectId: project.id,
            proposalId: proposal.id,
            clientId: client.id,
            freelancerId: freelancer.id,
            totalAmount: 4200,
            escrowBalance: 2800, // 4200 total - 1400 del hito 1 aprobado
            status: 'IN_PROGRESS',
            fundedAt: now,
            milestones: {
                create: [
                    {
                        id: randomUUID(),
                        order: 1,
                        title: 'Base de datos y sistema de retención de pagos',
                        description: 'Estructura principal de la base de datos y reglas de custodia Escrow.',
                        amount: 1400,
                        deliveryDays: 9,
                        status: 'APPROVED',
                        deliverableUrl: 'https://github.com/mateovillalobos/agromarket-b2b/pull/1',
                        deliverableHash: 'a94f8d2c7e10b634f21a98c05d71e84b3c90a12d4f6e8b10c3a5d7e9f1b2c4d6',
                        submittedAt: new Date(Date.now() - 86400000 * 3),
                        approvedAt: new Date(Date.now() - 86400000 * 2),
                    },
                    {
                        id: randomUUID(),
                        order: 2,
                        title: 'Catálogo mayorista y carrito para múltiples proveedores',
                        description: 'Subí la versión completa del catálogo mayorista y el carrito unificado. Listo para inspección y aprobación.',
                        amount: 1600,
                        deliveryDays: 11,
                        status: 'SUBMITTED', // ¡En Revisión!
                        deliverableUrl: 'https://github.com/mateovillalobos/agromarket-b2b/pull/14',
                        deliverableHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                        submittedAt: now,
                    },
                    {
                        id: randomUUID(),
                        order: 3,
                        title: 'Panel de seguimiento de envíos y entrega final',
                        description: 'Tablero para actualizar el estado de envíos y cierre de proyecto.',
                        amount: 1200,
                        deliveryDays: 8,
                        status: 'PENDING', // ¡Por Hacer!
                    },
                ],
            },
        },
        include: { milestones: true },
    });

    // 7. Crear un segundo Proyecto con Contrato en DRAFT listo para probar Fondeo Escrow (HU-05)
    const project2 = await prisma.project.create({
        data: {
            id: randomUUID(),
            clientId: client.id,
            title: 'Rediseño de Sistema de Diseño UI/UX para App Fintech',
            description: 'Rediseño integral de interfaz móvil, flujos de onboarding y transferencias bancarias en Figma.',
            budget: 2850,
            estimatedDate: new Date('2027-11-30'),
            status: 'ACTIVE',
        },
    });

    const proposal2 = await prisma.proposal.create({
        data: {
            id: randomUUID(),
            projectId: project2.id,
            freelancerId: freelancer.id,
            coverLetter: 'Propuesta de arquitectura visual y componentes modulares listos para desarrollo.',
            totalPrice: 2850,
            estimatedDays: 20,
            status: 'ACCEPTED',
        },
    });

    const draftContract = await prisma.contract.create({
        data: {
            id: randomUUID(),
            projectId: project2.id,
            proposalId: proposal2.id,
            clientId: client.id,
            freelancerId: freelancer.id,
            totalAmount: 2850,
            escrowBalance: 0,
            status: 'DRAFT', // ¡Pendiente de Fondeo Escrow (HU-05)!
            milestones: {
                create: [
                    {
                        id: randomUUID(),
                        order: 1,
                        title: 'Arquitectura de Información y Wireframes de Billetera',
                        description: 'Diagramas de flujo, estructura de navegación y prototipo navegable en baja fidelidad.',
                        amount: 950,
                        deliveryDays: 6,
                        status: 'PENDING',
                    },
                    {
                        id: randomUUID(),
                        order: 2,
                        title: 'Sistema de Componentes y UI Kit en Figma',
                        description: 'Tokens de diseño, componentes atómicos, estados de botones y formularios en alta fidelidad.',
                        amount: 1100,
                        deliveryDays: 8,
                        status: 'PENDING',
                    },
                    {
                        id: randomUUID(),
                        order: 3,
                        title: 'Prototipo Navegable Final y Guía de Implementación',
                        description: 'Flujo completo interactivo con especificaciones técnicas para desarrolladores frontend.',
                        amount: 800,
                        deliveryDays: 6,
                        status: 'PENDING',
                    },
                ],
            },
        },
        include: { milestones: true },
    });

    console.log('\n======================================================');
    console.log('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('======================================================');
    console.log(`Contrato 1 (En Progreso / Revisión Hito 2): #${contract.id}`);
    console.log(`Contrato 2 (DRAFT listo para Fondeo HU-05):   #${draftContract.id}`);
    console.log(`Hito #2 del Contrato 1 en estado SUBMITTED: ID ${contract.milestones[1].id}`);
    console.log('\nCredenciales para iniciar sesión en el Frontend:');
    console.log('  Email:    cliente@estudio.com');
    console.log('  Password: Password123!');
    console.log('  Rol:      CLIENT');
    console.log('======================================================\n');
}

seed()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error en seed:', err);
        process.exit(1);
    });
