import crypto from 'node:crypto';
import { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import {IJwtTokenGenerator,JwtUserClaims,
} from '../../application/interfaces/jwt-token-generator.interface.js';
import {  CONTRACT_SOCKET_EVENTS,ContractAccessValidator,ContractStatusChangedEventPayload, IRealtimeNotifier,MilestoneEventPayload,NewMessageEventPayload,
} from '../../application/interfaces/realtime-notifier.interface.js';
import { env } from '../../config/env.js';
import { prisma } from '../persistence/prisma/prisma.client.js';

// Esta es una expresion regular para validar que sea un UUID que es el identificador de las tablas 
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
//prefijo para identificar que es una sala
const ROOM_PREFIX = 'room:';

interface SocketData {
  user: JwtUserClaims;
}
// autenticacion aplicando socket io y middleware jwt
type AuthenticatedSocket = Socket<Record<string, any>, Record<string, any>, Record<string, any>, SocketData>;
// los parametros de entrada
interface JoinRoomPayload {
  contractId?: string;
  roomId?: string;
  conversationId?: string;
}

// parametros de salida
interface SendMessagePayload {
  id?: string;
  contractId?: string;
  conversationId?: string;
  roomId?: string;
  content?: string;
}

// respuesta de ark que es nos permite recepcion de errores y exitos
interface AckResponse {
  ok: boolean;
  room?: string;
  data?: unknown;
  error?: string;
}

type AckCallback = (response: AckResponse) => void;

/**
 * Construye el nombre canónico de sala para un contrato (`room:<contractId>`).
 */
export function getContractRoom(contractId: string): string {
  const cleanId = contractId.startsWith(ROOM_PREFIX)
    ? contractId.slice(ROOM_PREFIX.length)
    : contractId;
  return `${ROOM_PREFIX}${cleanId}`;
}

function extractContractId(input: unknown): string | null {
  let raw: unknown = input;
  if (typeof input === 'object' && input !== null) {
    const obj = input as JoinRoomPayload;
    raw = obj.contractId ?? obj.roomId ?? obj.conversationId;
  }
  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  const clean = trimmed.startsWith(ROOM_PREFIX)
    ? trimmed.slice(ROOM_PREFIX.length).trim()
    : trimmed;

  if (!clean || clean.length > 128) return null;
  return clean;
}

function extractHandshakeToken(socket: Socket): string | null {
  const authToken = socket.handshake.auth?.token;
  const headerAuth = socket.handshake.headers?.authorization;
  const queryToken = socket.handshake.query?.token;

  const candidate =
    typeof authToken === 'string'
      ? authToken
      : typeof headerAuth === 'string'
        ? headerAuth
        : typeof queryToken === 'string'
          ? queryToken
          : null;

  if (!candidate) return null;

  const trimmed = candidate.trim();
  if (!trimmed) return null;

  return trimmed.toLowerCase().startsWith('bearer ')
    ? trimmed.slice(7).trim()
    : trimmed;
}

/**
 * Validador por defecto de acceso a salas contractuales contra Prisma.
 * Falla cerrado (false) si el contrato no existe o el usuario no es participante.
 */
export const defaultContractAccessValidator: ContractAccessValidator = async (
  userId: string,
  contractId: string,
  role: string
): Promise<boolean> => {
  if (role === 'ADMIN') return true;
  if (!UUID_REGEX.test(contractId) || !UUID_REGEX.test(userId)) {
    return false;
  }

  try {
    // Validar si el ID pertenece a una conversación directa registrada en BD
    const conversation = await prisma.conversation.findUnique({
      where: { id: contractId },
      select: { clientId: true, freelancerId: true },
    });

    if (conversation) {
      return conversation.clientId === userId || conversation.freelancerId === userId;
    }

    // Soporte directo para el modelo Contract cuando exista en el esquema Prisma
    const prismaDynamic = prisma as unknown as {
      contract?: {
        findUnique: (args: unknown) => Promise<{
          clientId?: string;
          freelancerId?: string;
          proposal?: { freelancerId: string; project: { clientId: string } };
        } | null>;
      };
    };

    if (prismaDynamic.contract?.findUnique) {
      const contract = await prismaDynamic.contract.findUnique({
        where: { id: contractId },
        select: {
          clientId: true,
          freelancerId: true,
          proposal: {
            select: {
              freelancerId: true,
              project: { select: { clientId: true } },
            },
          },
        },
      });

      if (contract) {
        const clientId = contract.clientId ?? contract.proposal?.project.clientId;
        const freelancerId = contract.freelancerId ?? contract.proposal?.freelancerId;
        return clientId === userId || freelancerId === userId;
      }
    }

    // Respaldo sobre Proposal -> Project mientras se formaliza la tabla contracts
    const proposal = await prisma.proposal.findUnique({
      where: { id: contractId },
      select: {
        freelancerId: true,
        project: { select: { clientId: true } },
      },
    });

    if (!proposal) return false;
    return proposal.freelancerId === userId || proposal.project.clientId === userId;
  } catch {
    return false;
  }
};

export interface RealtimeSocketServerOptions {
  canAccessContract?: ContractAccessValidator;
  corsOrigins?: string[];
}

/**
 * Servidor de tiempo real con Socket.io para chat y notificaciones contractuales (HU-11).
 */
export class RealtimeSocketServer implements IRealtimeNotifier {
  private io: Server | null = null;
  private readonly canAccessContract: ContractAccessValidator;
  private readonly corsOrigins: string[];

  constructor(
    private readonly jwtTokenGenerator: IJwtTokenGenerator,
    options: RealtimeSocketServerOptions = {}
  ) {
    // 
    this.canAccessContract = options.canAccessContract ?? defaultContractAccessValidator;
    this.corsOrigins = options.corsOrigins ?? [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'https://freelancerhub.org',
      env.CLIENT_ORIGIN,
    ].filter(Boolean);
  }

  /**
   * Monta Socket.io sobre un servidor HTTP de Node/Express.
   */
  public attach(httpServer: HttpServer): Server {
    if (this.io) {
      return this.io;
    }

    const io = new Server(httpServer, {
      cors: {
        origin: this.corsOrigins.length > 0 ? this.corsOrigins : '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 20000,
      pingInterval: 25000,
    });

    // Middleware de autenticación JWT en el handshake de WebSocket
    io.use((socket, next) => {
      const token = extractHandshakeToken(socket);
      if (!token) {
        next(new Error('NoAutorizado: Token JWT requerido en el handshake.'));
        return;
      }

      try {
        const claims = this.jwtTokenGenerator.verifyAccessToken(token);
        socket.data.user = claims;
        next();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Token JWT inválido o expirado.';
        next(new Error(`NoAutorizado: ${message}`));
      }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
      this.registerSocketHandlers(io, socket);
    });

    this.io = io;
    return io;
  }

  private registerSocketHandlers(io: Server, socket: AuthenticatedSocket): void {
    const user = socket.data.user;
    // Unir al usuario a su sala personal para sincronización entre Web y Móvil (ej. cambio de avatar)
    void socket.join(`user:${user.sub}`);

    const handleJoin = async (input: unknown, ack?: AckCallback): Promise<void> => {
      const contractId = extractContractId(input);
      if (!contractId) {
        const errorMsg = 'Identificador de contrato inválido.';
        ack?.({ ok: false, error: errorMsg });
        socket.emit('socket_error', { message: errorMsg });
        return;
      }

      const authorized = await this.canAccessContract(user.sub, contractId, user.role);
      if (!authorized) {
        const errorMsg = 'No autorizado para suscribirse a este contrato.';
        ack?.({ ok: false, error: errorMsg });
        socket.emit('socket_error', { contractId, message: errorMsg });
        return;
      }

      const room = getContractRoom(contractId);
      await socket.join(room);
      ack?.({ ok: true, room });
    };

    const handleLeave = async (input: unknown, ack?: AckCallback): Promise<void> => {
      const contractId = extractContractId(input);
      if (!contractId) {
        ack?.({ ok: false, error: 'Identificador de contrato inválido.' });
        return;
      }

      const room = getContractRoom(contractId);
      await socket.leave(room);
      ack?.({ ok: true, room });
    };

    socket.on('join_contract', handleJoin);
    socket.on('join_room', handleJoin);
    socket.on('join_conversation', handleJoin);

    socket.on('leave_contract', handleLeave);
    socket.on('leave_room', handleLeave);

    socket.on('send_message', async (raw: SendMessagePayload, ack?: AckCallback) => {
      const contractId = extractContractId(raw);
      const content = typeof raw?.content === 'string' ? raw.content.trim() : '';

      if (!contractId || !content) {
        ack?.({ ok: false, error: 'contractId y content son obligatorios.' });
        return;
      }

      const room = getContractRoom(contractId);
      if (!socket.rooms.has(room)) {
        const errorMsg = 'Debes unirte a la sala del contrato antes de enviar mensajes.';
        ack?.({ ok: false, error: errorMsg });
        socket.emit('socket_error', { contractId, message: errorMsg });
        return;
      }

      let messageId = typeof raw?.id === 'string' && raw.id.trim() ? raw.id.trim() : crypto.randomUUID();
      let createdAt = new Date().toISOString();

      try {
        if (UUID_REGEX.test(contractId)) {
          const conv = await prisma.conversation.findUnique({
            where: { id: contractId },
            select: { id: true, clientId: true, freelancerId: true },
          });
          if (conv && (conv.clientId === user.sub || conv.freelancerId === user.sub || user.role === 'ADMIN')) {
            const saved = await prisma.message.create({
              data: {
                id: UUID_REGEX.test(messageId) ? messageId : undefined,
                conversationId: contractId,
                senderId: user.sub,
                content,
              },
            });
            await prisma.conversation.update({
              where: { id: contractId },
              data: { updatedAt: new Date() },
            });
            messageId = saved.id;
            createdAt = saved.createdAt.toISOString();
          }
        }
      } catch {
        // Fallback a emisión en tiempo real si la sala es de contrato sin conversación BD
      }

      const payload: NewMessageEventPayload = {
        id: messageId,
        contractId,
        senderId: user.sub,
        senderRole: user.role,
        content,
        createdAt,
      };

      io.to(room).emit(CONTRACT_SOCKET_EVENTS.NEW_MESSAGE, payload);
      ack?.({ ok: true, room, data: payload });
    });

    socket.on('typing', (raw: JoinRoomPayload) => {
      const contractId = extractContractId(raw);
      if (!contractId) return;
      const room = getContractRoom(contractId);
      if (!socket.rooms.has(room)) return;

      socket.to(room).emit('typing', { contractId, userId: user.sub });
    });

    socket.on('stop_typing', (raw: JoinRoomPayload) => {
      const contractId = extractContractId(raw);
      if (!contractId) return;
      const room = getContractRoom(contractId);
      if (!socket.rooms.has(room)) return;

      socket.to(room).emit('stop_typing', { contractId, userId: user.sub });
    });

    socket.on('mark_as_read', (raw: { contractId?: string; conversationId?: string; messageId?: string }) => {
      const contractId = extractContractId(raw);
      if (!contractId) return;
      const room = getContractRoom(contractId);
      if (!socket.rooms.has(room)) return;

      io.to(room).emit('message_read', {
        contractId,
        messageId: raw?.messageId,
        readerId: user.sub,
        readAt: new Date().toISOString(),
      });
    });

    // Limpieza explícita de listeners para evitar fugas de memoria al desconectar
    socket.on('disconnect', () => {
      socket.removeAllListeners();
    });
  }

  public emitNewMessage(contractId: string, payload: NewMessageEventPayload): void {
    this.io?.to(getContractRoom(contractId)).emit(CONTRACT_SOCKET_EVENTS.NEW_MESSAGE, payload);
  }

  public emitMessageNotification(recipientUserId: string, payload: NewMessageEventPayload): void {
    this.io
      ?.to(`user:${recipientUserId}`)
      .emit(CONTRACT_SOCKET_EVENTS.NEW_MESSAGE_NOTIFICATION, payload);
  }

  public emitProfileUpdated(userId: string, data: { avatarUrl?: string }): void {
    this.io?.to(`user:${userId}`).emit('profile_updated', { userId, ...data });
  }

  public emitMilestoneSubmitted(contractId: string, payload: MilestoneEventPayload): void {
    this.io?.to(getContractRoom(contractId)).emit(CONTRACT_SOCKET_EVENTS.MILESTONE_SUBMITTED, payload);
  }

  public emitMilestoneApproved(contractId: string, payload: MilestoneEventPayload): void {
    this.io?.to(getContractRoom(contractId)).emit(CONTRACT_SOCKET_EVENTS.MILESTONE_APPROVED, payload);
  }

  public emitContractStatusChanged(
    contractId: string,
    payload: ContractStatusChangedEventPayload
  ): void {
    this.io
      ?.to(getContractRoom(contractId))
      .emit(CONTRACT_SOCKET_EVENTS.CONTRACT_STATUS_CHANGED, payload);
  }

  public getServer(): Server | null {
    return this.io;
  }

  /**
   * Cierra todas las conexiones activas y libera el servidor Socket.io sin fugas de memoria.
   */
  public async close(): Promise<void> {
    if (!this.io) return;

    const ioInstance = this.io;
    this.io = null;

    ioInstance.disconnectSockets(true);
    await new Promise<void>((resolve) => {
      ioInstance.close(() => {
        ioInstance.removeAllListeners();
        resolve();
      });
    });
  }
}
