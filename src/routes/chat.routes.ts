import { Router, Request, Response } from 'express';
import { Container } from '../container.js';
import { prisma } from '../infrastructure/persistence/prisma/prisma.client.js';
import { uploadMiddleware } from '../middlewares/multer.middleware.js';
import { CONTRACT_SOCKET_EVENTS } from '../application/interfaces/realtime-notifier.interface.js';

export const chatRouter = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

chatRouter.use(Container.authMiddleware);

function formatUserName(user: {
  email: string;
  profile?: { firstName: string; lastName: string; avatarUrl: string | null; professionalTitle?: string | null } | null;
}): string {
  if (user.profile) {
    const full = `${user.profile.firstName} ${user.profile.lastName}`.trim();
    if (full) return full;
  }
  return user.email.split('@')[0];
}

function formatRoleLabel(role: string): string {
  switch (role) {
    case 'CLIENT':
      return 'Cliente Contratante';
    case 'FREELANCER':
      return 'Freelancer';
    case 'ADMIN':
      return 'Administrador';
    default:
      return role;
  }
}

async function getAuthorizedConversation(conversationId: string, userId: string, role: string) {
  if (!UUID_REGEX.test(conversationId)) {
    return { error: { status: 400, message: 'Identificador de conversación inválido.' }, conversation: null };
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      project: { select: { id: true, title: true } },
      client: {
        select: {
          id: true,
          email: true,
          role: true,
          profile: { select: { firstName: true, lastName: true, avatarUrl: true, professionalTitle: true } },
        },
      },
      freelancer: {
        select: {
          id: true,
          email: true,
          role: true,
          profile: { select: { firstName: true, lastName: true, avatarUrl: true, professionalTitle: true } },
        },
      },
    },
  });

  if (!conversation) {
    return { error: { status: 404, message: 'Conversación no encontrada.' }, conversation: null };
  }

  const isParticipant =
    conversation.clientId === userId ||
    conversation.freelancerId === userId ||
    role === 'ADMIN';

  if (!isParticipant) {
    return { error: { status: 403, message: 'No tienes permiso para acceder a esta conversación.' }, conversation: null };
  }

  return { error: null, conversation };
}

/**
 * @ruta GET /api/v1/chats/contacts
 * @descripcion Busca perfiles/usuarios existentes en la plataforma (excluyendo al usuario autenticado) para iniciar un nuevo chat
 */
chatRouter.get('/contacts', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
    }

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true,
        ...(search
          ? {
              OR: [
                { email: { contains: search, mode: 'insensitive' } },
                { profile: { firstName: { contains: search, mode: 'insensitive' } } },
                { profile: { lastName: { contains: search, mode: 'insensitive' } } },
                { profile: { professionalTitle: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      take: 30,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            professionalTitle: true,
          },
        },
      },
    });

    const data = users.map((u) => ({
      id: u.id,
      name: formatUserName(u),
      email: u.email,
      role: u.profile?.professionalTitle || formatRoleLabel(u.role),
      userRole: u.role,
      avatarUrl: u.profile?.avatarUrl ?? null,
    }));

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al buscar perfiles disponibles',
    });
  }
});

/**
 * @ruta GET /api/v1/chats
 * @descripcion Lista únicamente las conversaciones donde participa el usuario autenticado
 */
chatRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ clientId: userId }, { freelancerId: userId }],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        project: { select: { id: true, title: true } },
        client: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true, professionalTitle: true } },
          },
        },
        freelancer: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true, professionalTitle: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: userId },
              },
            },
          },
        },
      },
    });

    const data = conversations.map((conv) => {
      const isUserClient = conv.clientId === userId;
      const peer = isUserClient ? conv.freelancer : conv.client;
      const lastMsg = conv.messages[0] ?? null;

      return {
        id: conv.id,
        projectId: conv.projectId,
        projectName: conv.project?.title ?? conv.projectName ?? 'Conversación directa',
        peerId: peer.id,
        peerName: formatUserName(peer),
        peerRole: peer.profile?.professionalTitle || formatRoleLabel(peer.role),
        peerAvatarUrl: peer.profile?.avatarUrl ?? null,
        lastMessage: lastMsg?.content ?? (lastMsg?.attachmentUrl ? '📷 Imagen adjunta' : ''),
        lastMessageTime: (lastMsg?.createdAt ?? conv.updatedAt).toISOString(),
        lastMessageIsMine: lastMsg ? lastMsg.senderId === userId : false,
        unreadCount: conv._count.messages,
        isOnline: false,
      };
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al obtener las conversaciones',
    });
  }
});

/**
 * @ruta POST /api/v1/chats
 * @descripcion Crea o recupera una conversación entre el usuario autenticado y otro usuario (peerId)
 */
chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const userRole = req.user?.role ?? 'FREELANCER';
    if (!userId) {
      return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
    }

    const { peerId, projectId, projectName } = req.body ?? {};

    if (typeof peerId !== 'string' || !UUID_REGEX.test(peerId)) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'peerId debe ser un UUID válido.' });
    }

    if (peerId === userId) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'No puedes iniciar un chat contigo mismo.' });
    }

    if (projectId !== undefined && projectId !== null && (typeof projectId !== 'string' || !UUID_REGEX.test(projectId))) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'projectId debe ser un UUID válido.' });
    }

    const peerUser = await prisma.user.findUnique({
      where: { id: peerId },
      select: {
        id: true,
        email: true,
        role: true,
        profile: { select: { firstName: true, lastName: true, avatarUrl: true, professionalTitle: true } },
      },
    });

    if (!peerUser) {
      return res.status(404).json({ success: false, statusCode: 404, message: 'El usuario destinatario no existe.' });
    }

    let resolvedProjectName: string | null = typeof projectName === 'string' && projectName.trim() ? projectName.trim() : null;
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, title: true } });
      if (!project) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'El proyecto especificado no existe.' });
      }
      resolvedProjectName = project.title;
    }

    // Buscar si ya existe conversación entre ambos usuarios (para ese proyecto o en general)
    const existing = await prisma.conversation.findFirst({
      where: {
        OR: [
          { clientId: userId, freelancerId: peerId, ...(projectId ? { projectId } : {}) },
          { clientId: peerId, freelancerId: userId, ...(projectId ? { projectId } : {}) },
        ],
      },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        data: {
          id: existing.id,
          projectId: existing.projectId,
          projectName: resolvedProjectName ?? existing.projectName ?? 'Conversación directa',
          peerId: peerUser.id,
          peerName: formatUserName(peerUser),
          peerRole: peerUser.profile?.professionalTitle || formatRoleLabel(peerUser.role),
          peerAvatarUrl: peerUser.profile?.avatarUrl ?? null,
        },
      });
    }

    const clientId = userRole === 'CLIENT' || peerUser.role === 'FREELANCER' ? userId : peerId;
    const freelancerId = clientId === userId ? peerId : userId;

    const created = await prisma.conversation.create({
      data: {
        clientId,
        freelancerId,
        projectId: projectId ?? null,
        projectName: resolvedProjectName,
      },
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      data: {
        id: created.id,
        projectId: created.projectId,
        projectName: resolvedProjectName ?? 'Conversación directa',
        peerId: peerUser.id,
        peerName: formatUserName(peerUser),
        peerRole: peerUser.profile?.professionalTitle || formatRoleLabel(peerUser.role),
        peerAvatarUrl: peerUser.profile?.avatarUrl ?? null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al crear la conversación',
    });
  }
});

/**
 * @ruta GET /api/v1/chats/:conversationId/messages
 * @descripcion Obtiene el historial de mensajes validando que el usuario pertenezca a la conversación
 */
chatRouter.get('/:conversationId/messages', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const role = req.user?.role ?? 'FREELANCER';
    if (!userId) {
      return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
    }

    const conversationId = String(req.params.conversationId ?? '');
    const { error, conversation } = await getAuthorizedConversation(conversationId, userId, role);
    if (error || !conversation) {
      return res.status(error?.status ?? 404).json({
        success: false,
        statusCode: error?.status ?? 404,
        message: error?.message ?? 'Conversación no encontrada',
      });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });

    const data = messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      senderName: formatUserName(msg.sender),
      senderAvatarUrl: msg.sender.profile?.avatarUrl ?? null,
      content: msg.content,
      attachmentUrl: msg.attachmentUrl,
      isRead: msg.isRead,
      readAt: msg.readAt?.toISOString() ?? null,
      createdAt: msg.createdAt.toISOString(),
      isMine: msg.senderId === userId,
    }));

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al obtener los mensajes',
    });
  }
});

/**
 * @ruta POST /api/v1/chats/:conversationId/messages
 * @descripcion Envía y persiste un mensaje validando pertenencia a la conversación
 */
chatRouter.post('/:conversationId/messages', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const role = req.user?.role ?? 'FREELANCER';
    if (!userId) {
      return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
    }

    const conversationId = String(req.params.conversationId ?? '');
    const { error, conversation } = await getAuthorizedConversation(conversationId, userId, role);
    if (error || !conversation) {
      return res.status(error?.status ?? 404).json({
        success: false,
        statusCode: error?.status ?? 404,
        message: error?.message ?? 'Conversación no encontrada',
      });
    }

    const rawContent = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    const attachmentUrl = typeof req.body?.attachmentUrl === 'string' && req.body.attachmentUrl.trim()
      ? req.body.attachmentUrl.trim()
      : null;

    if (!rawContent && !attachmentUrl) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'El mensaje no puede estar vacío.',
      });
    }

    if (rawContent.length > 2000) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'El mensaje supera el máximo permitido de 2000 caracteres.',
      });
    }

    const [created] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: rawContent,
          attachmentUrl,
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    const payload = {
      id: created.id,
      contractId: conversationId,
      conversationId,
      senderId: created.senderId,
      senderRole: role,
      senderName: formatUserName(created.sender),
      senderAvatarUrl: created.sender.profile?.avatarUrl ?? null,
      content: created.content,
      attachmentUrl: created.attachmentUrl,
      isRead: created.isRead,
      createdAt: created.createdAt.toISOString(),
    };

    Container.realtimeServer.emitNewMessage(conversationId, payload);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      data: payload,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al enviar el mensaje',
    });
  }
});

/**
 * @ruta POST /api/v1/chats/:conversationId/attachments
 * @descripcion Sube una foto/imagen al chat y la registra como mensaje en tiempo real
 */
chatRouter.post(
  '/:conversationId/attachments',
  uploadMiddleware.single('file'),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      const role = req.user?.role ?? 'FREELANCER';
      if (!userId) {
        return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
      }

      const conversationId = String(req.params.conversationId ?? '');
      const { error, conversation } = await getAuthorizedConversation(conversationId, userId, role);
      if (error || !conversation) {
        return res.status(error?.status ?? 404).json({
          success: false,
          statusCode: error?.status ?? 404,
          message: error?.message ?? 'Conversación no encontrada',
        });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Archivo de imagen requerido.' });
      }

      const attachmentUrl = await Container.storageService.upload(req.file.buffer, req.file.originalname);
      const caption = typeof req.body?.content === 'string' ? req.body.content.trim() : '';

      const [created] = await prisma.$transaction([
        prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            content: caption,
            attachmentUrl,
          },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
              },
            },
          },
        }),
        prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        }),
      ]);

      const payload = {
        id: created.id,
        contractId: conversationId,
        conversationId,
        senderId: created.senderId,
        senderRole: role,
        senderName: formatUserName(created.sender),
        senderAvatarUrl: created.sender.profile?.avatarUrl ?? null,
        content: created.content,
        attachmentUrl: created.attachmentUrl,
        isRead: created.isRead,
        createdAt: created.createdAt.toISOString(),
      };

      Container.realtimeServer.emitNewMessage(conversationId, payload);

      return res.status(201).json({
        success: true,
        statusCode: 201,
        data: payload,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: error.message || 'Error al subir la imagen en el chat',
      });
    }
  }
);

/**
 * @ruta PATCH /api/v1/chats/:conversationId/read
 * @descripcion Marca como leídos los mensajes recibidos en la conversación
 */
chatRouter.patch('/:conversationId/read', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const role = req.user?.role ?? 'FREELANCER';
    if (!userId) {
      return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
    }

    const conversationId = String(req.params.conversationId ?? '');
    const { error, conversation } = await getAuthorizedConversation(conversationId, userId, role);
    if (error || !conversation) {
      return res.status(error?.status ?? 404).json({
        success: false,
        statusCode: error?.status ?? 404,
        message: error?.message ?? 'Conversación no encontrada',
      });
    }

    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: { updatedCount: result.count },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al marcar mensajes como leídos',
    });
  }
});
