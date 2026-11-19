import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, beforeEach, after } from 'node:test';
import { LoggerService } from '../src/infrastructure/logging/logger.service.js';
import { StructuredLogEntry } from '../src/application/interfaces/logger.interface.js';

describe('FLH-LOG-01: Sistema de Logs Estandarizados y Rotación Diaria', () => {
  const testLogsDir = path.join(process.cwd(), 'logs-test');
  let logger: LoggerService;

  beforeEach(() => {
    // Limpiar y recrear directorio de logs antes de cada prueba
    if (fs.existsSync(testLogsDir)) {
      fs.rmSync(testLogsDir, { recursive: true, force: true });
    }
    logger = new LoggerService({
      logsDir: testLogsDir,
      retentionDays: 7,
      enableConsole: false, // Silenciar consola durante tests
      enableFiles: true,
    });
  });

  after(() => {
    // Limpiar directorio de logs de prueba al concluir
    if (fs.existsSync(testLogsDir)) {
      fs.rmSync(testLogsDir, { recursive: true, force: true });
    }
  });

  it('1. Debe estructurar los logs en formato JSON con metadatos requeridos', () => {
    const captured: StructuredLogEntry[] = [];
    const unsubscribe = logger.onLog((entry) => captured.push(entry));

    logger.info('Convocatoria creada exitosamente', {
      context: 'PROJECT',
      action: 'CREATE_PROJECT',
      statusCode: 201,
      userId: 'usr_client_01',
      projectId: 'proj_101',
      durationMs: 35,
    });

    unsubscribe();

    assert.equal(captured.length, 1);
    const entry = captured[0];
    assert.equal(entry.level, 'INFO');
    assert.equal(entry.context, 'PROJECT');
    assert.equal(entry.action, 'CREATE_PROJECT');
    assert.equal(entry.statusCode, 201);
    assert.equal(entry.userId, 'usr_client_01');
    assert.equal(entry.durationMs, 35);
    assert.ok(entry.timestamp);
    assert.ok(new Date(entry.timestamp).getTime() > 0);
  });

  it('2. Debe estructurar por carpetas de fecha YYYY-MM-DD y clasificar en combined, error, warn, chat, business y http', () => {
    const today = new Date().toISOString().substring(0, 10);
    const dayDir = path.join(testLogsDir, today);
    const combinedPath = path.join(dayDir, 'combined.log');
    const errorPath = path.join(dayDir, 'error.log');
    const warnPath = path.join(dayDir, 'warn.log');
    const chatPath = path.join(dayDir, 'chat.log');
    const businessPath = path.join(dayDir, 'business.log');
    const httpPath = path.join(dayDir, 'http.log');

    // 1. Emitir un INFO de Chat (Debe ir a combined y chat)
    logger.info('Operación normal de consulta de mensajes', {
      context: 'CHAT:REST',
      action: 'GET_MESSAGES',
      statusCode: 200,
    });

    // 2. Emitir un WARN de validación en Chat (Debe ir a combined, warn y chat)
    logger.warn('Intento de mensaje con exceso de caracteres', {
      context: 'CHAT:REST',
      action: 'SEND_MESSAGE',
      statusCode: 400,
    });

    // 3. Emitir un ERROR crítico de Base de Datos (Debe ir a combined y error)
    logger.error('Fallo en consulta de base de datos', new Error('Prisma timeout'), {
      context: 'DATABASE',
      action: 'QUERY_FAILED',
      statusCode: 500,
    });

    // 4. Emitir un INFO de Ciclo de Negocio Core (Debe ir a combined y business)
    logger.info('Fondos bloqueados exitosamente en custodia Escrow', {
      context: 'ESCROW:FUND_CONTRACT',
      action: 'FUND_CONTRACT',
      statusCode: 200,
      contractId: 'ctr_777',
      amount: 2800,
    });

    // 5. Emitir un INFO de tráfico HTTP (Debe ir a combined y http)
    logger.info('GET /api/v1/projects -> 200', {
      context: 'HTTP',
      action: 'GET_PROJECTS',
      statusCode: 200,
    });

    // Validar existencia de la carpeta por día
    assert.ok(fs.existsSync(dayDir), 'La carpeta del día YYYY-MM-DD debe existir');

    // Validar existencia física de cada archivo clasificado
    assert.ok(fs.existsSync(combinedPath), 'combined.log debe existir');
    assert.ok(fs.existsSync(errorPath), 'error.log debe existir');
    assert.ok(fs.existsSync(warnPath), 'warn.log debe existir');
    assert.ok(fs.existsSync(chatPath), 'chat.log debe existir');
    assert.ok(fs.existsSync(businessPath), 'business.log debe existir');
    assert.ok(fs.existsSync(httpPath), 'http.log debe existir');

    // Leer contenidos y validar segregación
    const combinedLines = fs.readFileSync(combinedPath, 'utf8').trim().split('\n');
    const errorLines = fs.readFileSync(errorPath, 'utf8').trim().split('\n');
    const warnLines = fs.readFileSync(warnPath, 'utf8').trim().split('\n');
    const chatLines = fs.readFileSync(chatPath, 'utf8').trim().split('\n');
    const businessLines = fs.readFileSync(businessPath, 'utf8').trim().split('\n');
    const httpLines = fs.readFileSync(httpPath, 'utf8').trim().split('\n');

    assert.equal(combinedLines.length, 5, 'Combined debe registrar los 5 eventos del día');
    assert.equal(errorLines.length, 1, 'Error debe contener únicamente el error 500');
    assert.equal(warnLines.length, 1, 'Warn debe contener únicamente la advertencia 400');
    assert.equal(chatLines.length, 2, 'Chat debe contener los 2 eventos de CHAT (INFO y WARN)');
    assert.equal(businessLines.length, 1, 'Business debe contener el evento de Escrow/Negocio');
    assert.equal(httpLines.length, 1, 'Http debe contener el evento de HTTP');

    // Validar que cada línea sea un JSON válido
    for (const line of combinedLines) {
      const parsed = JSON.parse(line);
      assert.ok(parsed.timestamp);
      assert.ok(['INFO', 'WARN', 'ERROR'].includes(parsed.level));
    }
  });

  it('3. Situación 200/201 (OK / INFO): Registrar eventos normales de negocio y chat', () => {
    const captured: StructuredLogEntry[] = [];
    const unsubscribe = logger.onLog((entry) => captured.push(entry));

    logger.info('Mensaje enviado y emitido en tiempo real', {
      context: 'CHAT:REST',
      action: 'SEND_MESSAGE',
      statusCode: 201,
      conversationId: 'c1111111-1111-1111-1111-111111111111',
      userId: 'usr_freelancer_01',
    });

    logger.info('Fondos en custodia liberados a billetera', {
      context: 'WALLET',
      action: 'RELEASE_FUNDS',
      statusCode: 200,
      contractId: 'ctr_901',
      amount: 1600,
    });

    unsubscribe();

    assert.equal(captured.length, 2);
    assert.equal(captured[0].level, 'INFO');
    assert.equal(captured[0].statusCode, 201);
    assert.equal(captured[1].level, 'INFO');
    assert.equal(captured[1].statusCode, 200);
  });

  it('4. Situación 400 (WARN / Validación): Registrar datos inválidos o incompletos', () => {
    const captured: StructuredLogEntry[] = [];
    const unsubscribe = logger.onLog((entry) => captured.push(entry));

    logger.warn('Intento de enviar mensaje vacío', {
      context: 'CHAT:REST',
      action: 'SEND_MESSAGE',
      statusCode: 400,
      userId: 'usr_freelancer_01',
      conversationId: 'c1111111-1111-1111-1111-111111111111',
    });

    unsubscribe();

    assert.equal(captured.length, 1);
    assert.equal(captured[0].level, 'WARN');
    assert.equal(captured[0].statusCode, 400);
    assert.equal(captured[0].action, 'SEND_MESSAGE');
  });

  it('5. Situación 403 (WARN / Seguridad): Registrar acceso denegado a chats o contratos ajenos', () => {
    const captured: StructuredLogEntry[] = [];
    const unsubscribe = logger.onLog((entry) => captured.push(entry));

    logger.warn('Acceso denegado a conversación ajena', {
      context: 'CHAT:AUTH',
      action: 'ACCESS_DENIED',
      statusCode: 403,
      userId: 'usr_intruder_99',
      conversationId: 'c2222222-2222-2222-2222-222222222222',
    });

    unsubscribe();

    assert.equal(captured.length, 1);
    assert.equal(captured[0].level, 'WARN');
    assert.equal(captured[0].statusCode, 403);
    assert.equal(captured[0].action, 'ACCESS_DENIED');
  });

  it('6. Situación 500 (ERROR / Falla Interna): Capturar stack trace y mensaje de excepción', () => {
    const captured: StructuredLogEntry[] = [];
    const unsubscribe = logger.onLog((entry) => captured.push(entry));

    const dbError = new Error('PrismaClientInitializationError: Can\'t reach database server at 127.0.0.1:5433');
    logger.error('Error no controlado en el servidor', dbError, {
      context: 'SERVER',
      action: 'INTERNAL_EXCEPTION',
      statusCode: 500,
      userId: 'usr_client_01',
    });

    unsubscribe();

    assert.equal(captured.length, 1);
    assert.equal(captured[0].level, 'ERROR');
    assert.equal(captured[0].statusCode, 500);
    assert.ok(captured[0].error?.includes('127.0.0.1:5433'));
    assert.ok(captured[0].stack, 'Debe incluir stack trace');
  });
});
