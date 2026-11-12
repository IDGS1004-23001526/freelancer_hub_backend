import assert from 'node:assert/strict';
import { createServer, Server as HttpServer } from 'node:http';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/app.js';
import { JwtTokenGenerator } from '../src/infrastructure/security/jwt-token-generator.js';
import {
  getContractRoom,
  RealtimeSocketServer,
} from '../src/infrastructure/realtime/socket.server.js';

interface SocketIoTestClient {
  ws: WebSocket;
  events: Array<{ event: string; data: unknown }>;
  connectPacket: string;
  sendEvent: (event: string, data: unknown) => Promise<unknown>;
  waitForEvent: (eventName: string, timeoutMs?: number) => Promise<unknown>;
  close: () => Promise<void>;
}

function connectRawSocketIo(
  port: number,
  options: { authToken?: string; bearerHeader?: string } = {}
): Promise<SocketIoTestClient> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {};
    if (options.bearerHeader) {
      headers.Authorization = `Bearer ${options.bearerHeader}`;
    }

    const ws = new WebSocket(`ws://127.0.0.1:${port}/socket.io/?EIO=4&transport=websocket`, {
      // @ts-expect-error Node 24 undici WebSocket supports headers option
      headers,
    });

    const events: Array<{ event: string; data: unknown }> = [];
    const ackResolvers = new Map<number, (payload: unknown) => void>();
    const eventWaiters: Array<{
      eventName: string;
      resolve: (data: unknown) => void;
      timer: NodeJS.Timeout;
    }> = [];
    let ackSeq = 0;
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        ws.close();
        reject(new Error('Timeout esperando respuesta del handshake Socket.io'));
      }
    }, 5000);

    ws.addEventListener('message', (msgEvent) => {
      const raw = String(msgEvent.data);

      // Engine.IO ping -> responder pong
      if (raw === '2') {
        ws.send('3');
        return;
      }

      // Engine.IO open -> enviar Socket.IO CONNECT (40)
      if (raw.startsWith('0')) {
        const connectPayload = options.authToken
          ? `40${JSON.stringify({ token: options.authToken })}`
          : '40';
        ws.send(connectPayload);
        return;
      }

      // Socket.IO CONNECT_ERROR (44...)
      if (raw.startsWith('44')) {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          resolve({
            ws,
            events,
            connectPacket: raw,
            sendEvent: async () => {
              throw new Error('No conectado');
            },
            waitForEvent: async () => {
              throw new Error('No conectado');
            },
            close: async () => {
              ws.close();
            },
          });
        }
        return;
      }

      // Socket.IO CONNECT OK (40...)
      if (raw.startsWith('40')) {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          resolve({
            ws,
            events,
            connectPacket: raw,
            sendEvent: (event: string, data: unknown) => {
              const id = ackSeq++;
              return new Promise((resAck, rejAck) => {
                const timer = setTimeout(() => {
                  ackResolvers.delete(id);
                  rejAck(new Error(`Timeout esperando ack de ${event}`));
                }, 3000);
                ackResolvers.set(id, (payload) => {
                  clearTimeout(timer);
                  resAck(payload);
                });
                ws.send(`42${id}${JSON.stringify([event, data])}`);
              });
            },
            waitForEvent: (eventName: string, timeoutMs = 2000) => {
              const existingIndex = events.findIndex((e) => e.event === eventName);
              if (existingIndex !== -1) {
                const [found] = events.splice(existingIndex, 1);
                return Promise.resolve(found.data);
              }
              return new Promise((resEv, rejEv) => {
                const timer = setTimeout(() => {
                  const idx = eventWaiters.findIndex((w) => w.resolve === resEv);
                  if (idx !== -1) eventWaiters.splice(idx, 1);
                  rejEv(new Error(`Timeout esperando evento "${eventName}"`));
                }, timeoutMs);
                eventWaiters.push({ eventName, resolve: resEv, timer });
              });
            },
            close: () =>
              new Promise<void>((resClose) => {
                if (ws.readyState === WebSocket.CLOSED) {
                  resClose();
                  return;
                }
                ws.addEventListener('close', () => resClose(), { once: true });
                ws.close();
              }),
          });
        }
        return;
      }

      // Socket.IO ACK (43<id>[...])
      if (raw.startsWith('43')) {
        const bracketIdx = raw.indexOf('[');
        if (bracketIdx !== -1) {
          const ackId = Number(raw.slice(2, bracketIdx));
          const parsed = JSON.parse(raw.slice(bracketIdx)) as unknown[];
          const resolver = ackResolvers.get(ackId);
          if (resolver) {
            ackResolvers.delete(ackId);
            resolver(parsed[0]);
          }
        }
        return;
      }

      // Socket.IO EVENT (42["event", data])
      if (raw.startsWith('42')) {
        const bracketIdx = raw.indexOf('[');
        if (bracketIdx !== -1) {
          const [eventName, payload] = JSON.parse(raw.slice(bracketIdx)) as [string, unknown];
          const waiterIdx = eventWaiters.findIndex((w) => w.eventName === eventName);
          if (waiterIdx !== -1) {
            const [waiter] = eventWaiters.splice(waiterIdx, 1);
            clearTimeout(waiter.timer);
            waiter.resolve(payload);
          } else {
            events.push({ event: eventName, data: payload });
          }
        }
      }
    });

    ws.addEventListener('error', (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
}

describe('RealtimeSocketServer (FLH-BE-SOCKET / HU-11)', () => {
  const jwtGenerator = new JwtTokenGenerator();
  let httpServer: HttpServer;
  let realtimeServer: RealtimeSocketServer;
  let port: number;

  const clientId = '11111111-1111-4111-8111-111111111111';
  const freelancerId = '22222222-2222-4222-8222-222222222222';
  const intruderId = '33333333-3333-4333-8333-333333333333';
  const contract1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const contract2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  const participantsByContract: Record<string, Set<string>> = {
    [contract1]: new Set([clientId, freelancerId]),
    [contract2]: new Set([intruderId]),
  };

  let clientToken: string;
  let freelancerToken: string;
  let intruderToken: string;

  before(async () => {
    clientToken = jwtGenerator.generateAccessToken({
      sub: clientId,
      email: 'client@test.com',
      role: 'CLIENT',
      isVerified: true,
    });
    freelancerToken = jwtGenerator.generateAccessToken({
      sub: freelancerId,
      email: 'freelancer@test.com',
      role: 'FREELANCER',
      isVerified: true,
    });
    intruderToken = jwtGenerator.generateAccessToken({
      sub: intruderId,
      email: 'intruder@test.com',
      role: 'FREELANCER',
      isVerified: true,
    });

    const app = createApp();
    httpServer = createServer(app);

    realtimeServer = new RealtimeSocketServer(jwtGenerator, {
      canAccessContract: async (userId, contractId) => {
        return participantsByContract[contractId]?.has(userId) ?? false;
      },
    });
    realtimeServer.attach(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, '127.0.0.1', () => {
        const address = httpServer.address();
        assert.ok(address && typeof address === 'object');
        port = address.port;
        resolve();
      });
    });
  });

  after(async () => {
    await realtimeServer.close();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  it('rechaza conexiones sin token JWT en el handshake', async () => {
    const conn = await connectRawSocketIo(port);
    assert.ok(conn.connectPacket.startsWith('44'), `Se esperaba 44 CONNECT_ERROR, recibido: ${conn.connectPacket}`);
    assert.match(conn.connectPacket, /NoAutorizado/);
    await conn.close();
  });

  it('rechaza conexiones con token JWT inválido', async () => {
    const conn = await connectRawSocketIo(port, { authToken: 'token.invalido.123' });
    assert.ok(conn.connectPacket.startsWith('44'));
    assert.match(conn.connectPacket, /NoAutorizado/);
    await conn.close();
  });

  it('acepta conexiones autenticadas por auth.token y header Bearer', async () => {
    const c1 = await connectRawSocketIo(port, { authToken: clientToken });
    const c2 = await connectRawSocketIo(port, { bearerHeader: freelancerToken });
    assert.ok(c1.connectPacket.startsWith('40'));
    assert.ok(c2.connectPacket.startsWith('40'));
    await c1.close();
    await c2.close();
  });

  it('impide a usuarios no autorizados unirse o escuchar canales de contratos ajenos', async () => {
    const clientConn = await connectRawSocketIo(port, { authToken: clientToken });
    const intruderConn = await connectRawSocketIo(port, { authToken: intruderToken });

    const clientJoin = (await clientConn.sendEvent('join_contract', { contractId: contract1 })) as {
      ok: boolean;
      room?: string;
    };
    assert.equal(clientJoin.ok, true);
    assert.equal(clientJoin.room, getContractRoom(contract1));

    const intruderJoin = (await intruderConn.sendEvent('join_contract', { contractId: contract1 })) as {
      ok: boolean;
      error?: string;
    };
    assert.equal(intruderJoin.ok, false);
    assert.match(intruderJoin.error ?? '', /No autorizado/);

    // El intruso tampoco puede enviar mensajes a esa sala
    const intruderMsgAck = (await intruderConn.sendEvent('send_message', {
      contractId: contract1,
      content: 'Mensaje intruso',
    })) as { ok: boolean };
    assert.equal(intruderMsgAck.ok, false);

    // El intruso se une a SU propio contrato (contract2) y no debe recibir eventos de contract1
    const intruderOwnJoin = (await intruderConn.sendEvent('join_contract', { contractId: contract2 })) as {
      ok: boolean;
    };
    assert.equal(intruderOwnJoin.ok, true);

    await clientConn.sendEvent('send_message', {
      contractId: contract1,
      content: 'Mensaje privado del contrato 1',
    });

    const receivedByClient = (await clientConn.waitForEvent('new_message')) as {
      contractId: string;
      senderId: string;
      content: string;
    };
    assert.equal(receivedByClient.contractId, contract1);
    assert.equal(receivedByClient.senderId, clientId);
    assert.equal(receivedByClient.content, 'Mensaje privado del contrato 1');

    // Verificar que el intruso NO recibió el evento new_message de contract1
    await assert.rejects(
      () => intruderConn.waitForEvent('new_message', 300),
      /Timeout esperando evento/
    );

    await clientConn.close();
    await intruderConn.close();
  });

  it('emite milestone_submitted, milestone_approved y contract_status_changed solo a la sala del contrato', async () => {
    const freelancerConn = await connectRawSocketIo(port, { authToken: freelancerToken });
    const intruderConn = await connectRawSocketIo(port, { authToken: intruderToken });

    await freelancerConn.sendEvent('join_contract', { contractId: contract1 });
    await intruderConn.sendEvent('join_contract', { contractId: contract2 });

    realtimeServer.emitMilestoneSubmitted(contract1, {
      contractId: contract1,
      milestoneId: 'ms-1',
      title: 'Entrega Backend',
      status: 'SUBMITTED',
      actorId: freelancerId,
      timestamp: new Date().toISOString(),
    });

    realtimeServer.emitMilestoneApproved(contract1, {
      contractId: contract1,
      milestoneId: 'ms-1',
      title: 'Entrega Backend',
      status: 'APPROVED',
      actorId: clientId,
      timestamp: new Date().toISOString(),
    });

    realtimeServer.emitContractStatusChanged(contract1, {
      contractId: contract1,
      previousStatus: 'FUNDED',
      newStatus: 'IN_PROGRESS',
      actorId: clientId,
      timestamp: new Date().toISOString(),
    });

    const submitted = (await freelancerConn.waitForEvent('milestone_submitted')) as {
      milestoneId: string;
      status: string;
    };
    const approved = (await freelancerConn.waitForEvent('milestone_approved')) as {
      milestoneId: string;
      status: string;
    };
    const statusChanged = (await freelancerConn.waitForEvent('contract_status_changed')) as {
      newStatus: string;
    };

    assert.equal(submitted.milestoneId, 'ms-1');
    assert.equal(submitted.status, 'SUBMITTED');
    assert.equal(approved.status, 'APPROVED');
    assert.equal(statusChanged.newStatus, 'IN_PROGRESS');

    assert.equal(
      intruderConn.events.filter((e) =>
        ['milestone_submitted', 'milestone_approved', 'contract_status_changed'].includes(e.event)
      ).length,
      0
    );

    await freelancerConn.close();
    await intruderConn.close();
  });
});
