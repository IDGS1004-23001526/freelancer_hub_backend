import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { Container } from '../src/container.js';

describe('Verificación de Inserción Real de Logs en Carpetas Estandarizadas', () => {
  const today = new Date().toISOString().substring(0, 10);
  const dayDir = path.join(process.cwd(), 'logs', today);

  it('Debe generar e insertar logs reales en cada archivo clasificado del día', async () => {
    // 1. Simular eventos de Ciclo de Negocio Core (FLH-TEST-E2E)
    Container.logger.info('Nueva convocatoria publicada por cliente', {
      context: 'PROJECT:CREATE_PROJECT',
      action: 'CREATE_PROJECT',
      statusCode: 201,
      userId: 'usr_client_99',
      projectId: 'proj_ecommerce_2026',
      budget: 5000,
      durationMs: 42,
    });

    Container.logger.info('Propuesta enviada por desarrollador con cotización de hitos', {
      context: 'PROPOSAL:SUBMIT_PROPOSAL',
      action: 'SUBMIT_PROPOSAL',
      statusCode: 201,
      userId: 'usr_freelancer_01',
      proposalId: 'prop_ecommerce_01',
      totalPrice: 4200,
      durationMs: 38,
    });

    Container.logger.info('Contrato creado tras aceptación mutua', {
      context: 'CONTRACT:CREATE_CONTRACT',
      action: 'CREATE_CONTRACT',
      statusCode: 201,
      contractId: 'ctr_ecommerce_01',
      durationMs: 25,
    });

    Container.logger.info('Depósito retenido en garantía Escrow', {
      context: 'ESCROW:FUND_CONTRACT',
      action: 'FUND_CONTRACT',
      statusCode: 200,
      contractId: 'ctr_ecommerce_01',
      amount: 2800,
      durationMs: 65,
    });

    Container.logger.info('Entregable con hash SHA-256 recibido para revisión', {
      context: 'MILESTONE:ADVANCE_MILESTONE',
      action: 'ADVANCE_MILESTONE',
      statusCode: 200,
      contractId: 'ctr_ecommerce_01',
      milestoneId: 'ms_01',
      newStatus: 'IN_REVIEW',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });

    Container.logger.info('Hito aprobado y fondos acreditados en billetera del desarrollador', {
      context: 'WALLET:DEPOSIT_FUNDS',
      action: 'DEPOSIT_FUNDS',
      statusCode: 200,
      walletId: 'w_free_01',
      amount: 1400,
      fee: 140,
    });

    // 2. Simular eventos de Chat y WebSockets (HU-11)
    Container.logger.info('Mensaje enviado y notificado por Socket.io', {
      context: 'CHAT:SEND_MESSAGE',
      action: 'SEND_MESSAGE',
      statusCode: 201,
      userId: 'usr_freelancer_01',
      conversationId: 'c_live_chat_01',
      durationMs: 14,
    });

    Container.logger.info('Cliente Socket conectado y autenticado por JWT', {
      context: 'CHAT:SOCKET',
      action: 'HANDSHAKE',
      statusCode: 200,
      userId: 'usr_freelancer_01',
    });

    // 3. Simular advertencia 400 y de seguridad 403 (WARN)
    Container.logger.warn('Intento de unirse a canal de chat no autorizado', {
      context: 'CHAT:SOCKET',
      action: 'JOIN_ROOM_FORBIDDEN',
      statusCode: 403,
      userId: 'usr_intruder_99',
      room: 'contract_room_private',
    });

    // 4. Simular error crítico 500 con excepción (ERROR)
    Container.logger.error(
      'Falla al conectar con el procesador de pagos',
      new Error('GatewayTimeout: Connection timed out to stripe API'),
      {
        context: 'ESCROW:GATEWAY_ERROR',
        action: 'PAYMENT_GATEWAY_TIMEOUT',
        statusCode: 500,
        userId: 'usr_client_99',
      }
    );

    // 5. Simular tráfico HTTP de Express
    Container.logger.info('GET /api/v1/projects -> 200 (15ms)', {
      context: 'HTTP',
      action: 'GET_/api/v1/projects',
      statusCode: 200,
      durationMs: 15,
    });

    // Verificaciones físicas en disco
    assert.ok(fs.existsSync(dayDir), `El directorio ${dayDir} debe existir`);

    const files = ['business.log', 'chat.log', 'error.log', 'warn.log', 'http.log', 'combined.log'];
    for (const file of files) {
      const filePath = path.join(dayDir, file);
      assert.ok(fs.existsSync(filePath), `El archivo ${file} debe existir en ${dayDir}`);
      const content = fs.readFileSync(filePath, 'utf8').trim();
      assert.ok(content.length > 0, `El archivo ${file} no debe estar vacío`);
    }

    console.log(`\n[OK] Directorio verificado: ${dayDir}`);
    for (const file of files) {
      const filePath = path.join(dayDir, file);
      const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
      console.log(`   * ${file} -> ${lines.length} lineas registradas`);
    }
  });
});
