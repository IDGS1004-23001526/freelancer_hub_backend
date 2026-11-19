import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

/**
 * Configuración y especificación OpenAPI 3.0 (Swagger) para FreelancerHub Backend.
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'FreelancerHub Backend API',
      version: '1.0.0',
      description:
        'Documentación interactiva de la API REST de FreelancerHub (Autenticación, Sesiones JWT, Custodia Escrow y Módulos de Decisión).',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: `Servidor local (${env.NODE_ENV})`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa el Access Token JWT en formato: Bearer <token>',
        },
      },
      schemas: {
        UserProfileDto: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'c9f39300-fdc1-4612-9a5b-65a8bc235c55' },
            email: { type: 'string', format: 'email', example: 'paulo@freelancerhub.com' },
            fullName: { type: 'string', example: 'Paulo Essau' },
            role: { type: 'string', enum: ['CLIENT', 'FREELANCER', 'ADMIN'], example: 'CLIENT' },
            isVerified: { type: 'boolean', example: false },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponseDto: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: '7aaf329c470b1dbe97093fd337c9c86da8e62e...' },
            tokenType: { type: 'string', example: 'Bearer' },
            expiresIn: { type: 'string', example: '15m' },
            user: { $ref: '#/components/schemas/UserProfileDto' },
          },
        },
        RegisterRequestDto: {
          type: 'object',
          required: ['email', 'password', 'fullName', 'role'],
          properties: {
            email: { type: 'string', format: 'email', example: 'paulo@freelancerhub.com' },
            password: { type: 'string', format: 'password', example: 'Password123!' },
            fullName: { type: 'string', example: 'Paulo Essau' },
            role: { type: 'string', enum: ['CLIENT', 'FREELANCER', 'ADMIN'], example: 'CLIENT' },
          },
        },
        LoginRequestDto: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'paulo@freelancerhub.com' },
            password: { type: 'string', format: 'password', example: 'Password123!' },
          },
        },
        RefreshTokenRequestDto: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string', example: '7aaf329c470b1dbe97093fd337c9c86da8e62e...' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'integer', example: 400 },
            error: { type: 'string', example: 'PeticionInvalida' },
            message: { type: 'string', example: 'Descripción detallada del error.' },
          },
        },
        ChatConversationDto: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'a0de5008-8ec6-47b4-863f-45ab9c553847' },
            projectId: { type: 'string', format: 'uuid', nullable: true, example: 'b1de5008-8ec6-47b4-863f-45ab9c553847' },
            projectName: { type: 'string', example: 'E-commerce móvil con pasarela de pagos' },
            peerId: { type: 'string', format: 'uuid', example: 'c9f39300-fdc1-4612-9a5b-65a8bc235c55' },
            peerName: { type: 'string', example: 'Carlos Mendoza' },
            peerRole: { type: 'string', example: 'Full Stack Developer' },
            peerAvatarUrl: { type: 'string', nullable: true, example: 'https://storage.../avatar.jpg' },
            lastMessage: { type: 'string', example: 'Hola, ¿cómo va el progreso?' },
            lastMessageTime: { type: 'string', format: 'date-time' },
            lastMessageIsMine: { type: 'boolean', example: false },
            unreadCount: { type: 'integer', example: 2 },
            isOnline: { type: 'boolean', example: false },
          },
        },
        ChatMessageDto: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'd3f39300-fdc1-4612-9a5b-65a8bc235c55' },
            conversationId: { type: 'string', format: 'uuid', example: 'a0de5008-8ec6-47b4-863f-45ab9c553847' },
            senderId: { type: 'string', format: 'uuid', example: 'c9f39300-fdc1-4612-9a5b-65a8bc235c55' },
            senderRole: { type: 'string', example: 'CLIENT' },
            senderName: { type: 'string', example: 'Carlos Mendoza' },
            senderAvatarUrl: { type: 'string', nullable: true },
            content: { type: 'string', example: 'Hola, adjunto los requerimientos.' },
            attachmentUrl: { type: 'string', nullable: true, example: 'https://storage.../img.jpg' },
            isRead: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ChatSendMessageRequestDto: {
          type: 'object',
          properties: {
            content: { type: 'string', maxLength: 2000, example: 'Hola, ¿cómo va la integración?' },
            attachmentUrl: { type: 'string', nullable: true, example: 'https://storage.../img.jpg' },
          },
        },
        ChatCreateConversationRequestDto: {
          type: 'object',
          required: ['peerId'],
          properties: {
            peerId: { type: 'string', format: 'uuid', example: 'c9f39300-fdc1-4612-9a5b-65a8bc235c55' },
            projectId: { type: 'string', format: 'uuid', nullable: true, example: 'b1de5008-8ec6-47b4-863f-45ab9c553847' },
            projectName: { type: 'string', nullable: true, example: 'Desarrollo API REST' },
          },
        },
        ContractDto: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'e1de5008-8ec6-47b4-863f-45ab9c553847' },
            proposalId: { type: 'string', format: 'uuid' },
            clientId: { type: 'string', format: 'uuid' },
            freelancerId: { type: 'string', format: 'uuid' },
            projectId: { type: 'string', format: 'uuid' },
            totalAmount: { type: 'number', example: 1500.0 },
            status: { type: 'string', enum: ['DRAFT', 'FUNDED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED'], example: 'FUNDED' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateContractRequestDto: {
          type: 'object',
          required: ['proposalId'],
          properties: {
            proposalId: { type: 'string', format: 'uuid', example: 'f2de5008-8ec6-47b4-863f-45ab9c553847' },
          },
        },
        ProposalDto: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            projectId: { type: 'string', format: 'uuid' },
            freelancerId: { type: 'string', format: 'uuid' },
            coverLetter: { type: 'string', example: 'Tengo más de 5 años de experiencia con Node y React.' },
            totalPrice: { type: 'number', example: 1200.0 },
            estimatedDays: { type: 'integer', example: 14 },
            status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'REJECTED'], example: 'PENDING' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateProposalRequestDto: {
          type: 'object',
          required: ['projectId', 'coverLetter', 'totalPrice', 'estimatedDays', 'milestones'],
          properties: {
            projectId: { type: 'string', format: 'uuid' },
            coverLetter: { type: 'string', minLength: 20, maxLength: 5000, example: 'Propuesta técnica y económica para la implementación del sistema.' },
            totalPrice: { type: 'number', example: 1500 },
            estimatedDays: { type: 'integer', example: 20 },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                required: ['title', 'amount', 'deliveryDays'],
                properties: {
                  title: { type: 'string', minLength: 5, example: 'Hito 1: Arquitectura y base de datos' },
                  description: { type: 'string', example: 'Modelado relacional y endpoints de autenticación' },
                  amount: { type: 'number', example: 500 },
                  deliveryDays: { type: 'integer', example: 7 },
                  order: { type: 'integer', example: 1 },
                },
              },
            },
          },
        },
        WalletBalanceDto: {
          type: 'object',
          properties: {
            availableBalance: { type: 'number', example: 2500.5 },
            escrowBalance: { type: 'number', example: 1500.0 },
            pendingWithdrawal: { type: 'number', example: 0.0 },
          },
        },
        WalletDepositRequestDto: {
          type: 'object',
          required: ['amount'],
          properties: {
            amount: { type: 'number', example: 500.0 },
            description: { type: 'string', example: 'Abono de saldo para custodia de contrato' },
          },
        },
        WalletWithdrawRequestDto: {
          type: 'object',
          required: ['amount', 'clabeAccount'],
          properties: {
            amount: { type: 'number', example: 1000.0 },
            clabeAccount: { type: 'string', minLength: 18, maxLength: 18, example: '012180015678901234' },
          },
        },
        SkillDto: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'TypeScript' },
            category: { type: 'string', example: 'Frontend' },
          },
        },
      },
    },
    paths: {
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Verificar estado de salud del servidor',
          responses: {
            200: {
              description: 'Servidor operando correctamente',
            },
          },
        },
      },
      '/api/v1/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Registrar una nueva cuenta de usuario',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterRequestDto' },
              },
            },
          },
          responses: {
            201: {
              description: 'Usuario registrado exitosamente',
            },
            400: {
              description: 'Datos de entrada inválidos',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            409: {
              description: 'El correo electrónico ya está registrado',
            },
          },
        },
      },
      '/api/v1/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Autenticar usuario y obtener tokens JWT',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequestDto' },
              },
            },
          },
          responses: {
            200: {
              description: 'Autenticación exitosa',
            },
            401: {
              description: 'Credenciales inválidas',
            },
            403: {
              description: 'Cuenta de usuario inactiva o suspendida',
            },
          },
        },
      },
      '/api/v1/auth/refresh-token': {
        post: {
          tags: ['Auth'],
          summary: 'Rotar Refresh Token y renovar sesión',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RefreshTokenRequestDto' },
              },
            },
          },
          responses: {
            200: {
              description: 'Sesión renovada exitosamente',
            },
            401: {
              description: 'Refresh token inválido, revocado o expirado',
            },
          },
        },
      },
      '/api/v1/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Cerrar sesión y revocar Refresh Token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RefreshTokenRequestDto' },
              },
            },
          },
          responses: {
            200: {
              description: 'Sesión cerrada correctamente',
            },
          },
        },
      },
      '/api/v1/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Obtener perfil del usuario autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Perfil de usuario obtenido exitosamente',
            },
            401: {
              description: 'No autorizado / Token inválido o ausente',
            },
          },
        },
      },
      '/api/v1/users/me/profile': {
        get: {
          tags: ['Profile'],
          summary: 'Obtiene el perfil del usuario autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Perfil retornado exitosamente',
            },
          },
        },
        put: {
          tags: ['Profile'],
          summary: 'Actualiza o inicializa (Upsert) el perfil del usuario',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['first_name', 'last_name'],
                  properties: {
                    first_name: { type: 'string' },
                    last_name: { type: 'string' },
                    bio: { type: 'string' },
                    phone: { type: 'string', example: '+524771234567' },
                    skills: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Cambios guardados correctamente',
            },
            400: {
              description: 'Error de formato en los datos ingresados',
            },
          },
        },
      },
      '/api/v1/users/me/avatar': {
        post: {
          tags: ['Profile'],
          summary: 'Carga o actualiza la imagen de perfil',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    avatar: {
                      type: 'string',
                      format: 'binary',
                      description: 'Archivo JPG o PNG (Max 5MB)',
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Avatar actualizado correctamente',
            },
            400: {
              description: 'Formato de imagen no permitido',
            },
          },
        },
      },
      '/api/v1/projects': {
        get: {
          tags: ['Projects'],
          summary: 'Consulta y filtra convocatorias activas para el feed',
          parameters: [
            {
              name: 'search',
              in: 'query',
              required: false,
              description: 'Búsqueda por palabra clave en título y descripción',
              schema: { type: 'string', example: 'React' },
            },
            {
              name: 'category',
              in: 'query',
              required: false,
              description: 'Filtro por categoría de habilidades',
              schema: { type: 'string', example: 'Frontend' },
            },
            {
              name: 'minBudget',
              in: 'query',
              required: false,
              description: 'Presupuesto mínimo',
              schema: { type: 'number', example: 500 },
            },
            {
              name: 'maxBudget',
              in: 'query',
              required: false,
              description: 'Presupuesto máximo',
              schema: { type: 'number', example: 5000 },
            },
            {
              name: 'skills',
              in: 'query',
              required: false,
              description: 'Filtro por habilidades (lista separada por comas o array)',
              schema: { type: 'string', example: 'React,Node.js' },
            },
            {
              name: 'page',
              in: 'query',
              required: false,
              description: 'Número de página',
              schema: { type: 'integer', default: 1, example: 1 },
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              description: 'Cantidad de elementos por página',
              schema: { type: 'integer', default: 10, example: 10 },
            },
          ],
          responses: {
            200: {
              description: 'Lista paginada de convocatorias activas',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'number', example: 200 },
                      message: { type: 'string', example: 'Convocatorias obtenidas exitosamente' },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            clientId: { type: 'string', format: 'uuid' },
                            title: { type: 'string' },
                            description: { type: 'string' },
                            budget: { type: 'number' },
                            skills: { type: 'array', items: { type: 'string' } },
                            estimatedDate: { type: 'string', format: 'date-time' },
                            status: { type: 'string', example: 'ACTIVE' },
                            createdAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                      meta: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer', example: 25 },
                          totalPages: { type: 'integer', example: 3 },
                          currentPage: { type: 'integer', example: 1 },
                          limit: { type: 'integer', example: 10 },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: { description: 'Parámetros de consulta inválidos' },
          },
        },
        post: {
          tags: ['Projects'],
          summary: 'Crea una convocatoria',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'description', 'budget', 'skills', 'estimatedDate'],
                  properties: {
                    title: { type: 'string', minLength: 10, example: 'E-commerce móvil con pasarela de pagos' },
                    description: { type: 'string', minLength: 30, example: 'App móvil en Flutter con pagos y panel administrativo.' },
                    budget: { type: 'number', exclusiveMinimum: 0, example: 2400 },
                    skills: { type: 'array', minItems: 3, items: { type: 'string' }, example: ['Flutter', '.NET Core', 'SQL Server'] },
                    estimatedDate: { type: 'string', format: 'date-time', example: '2027-01-15T00:00:00Z' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Convocatoria creada' },
            400: { description: 'Validación fallida' },
            401: { description: 'No autenticado' },
            403: { description: 'Rol no autorizado' },
          },
        },
      },
      '/api/v1/chats/contacts': {
        get: {
          tags: ['Chats'],
          summary: 'Buscar usuarios o perfiles para iniciar una conversación',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'search',
              in: 'query',
              required: false,
              description: 'Término de búsqueda por nombre, apellido, título o correo',
              schema: { type: 'string', example: 'Carlos' },
            },
          ],
          responses: {
            200: {
              description: 'Lista de contactos disponibles',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            email: { type: 'string', format: 'email' },
                            name: { type: 'string', example: 'Carlos Mendoza' },
                            role: { type: 'string', example: 'FREELANCER' },
                            roleLabel: { type: 'string', example: 'Freelancer' },
                            avatarUrl: { type: 'string', nullable: true },
                            professionalTitle: { type: 'string', example: 'Full Stack Dev' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/api/v1/chats': {
        get: {
          tags: ['Chats'],
          summary: 'Listar conversaciones del usuario autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Lista de conversaciones activas con último mensaje y contador de no leídos',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ChatConversationDto' },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'No autenticado' },
          },
        },
        post: {
          tags: ['Chats'],
          summary: 'Crear o recuperar una conversación directa o por proyecto',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChatCreateConversationRequestDto' },
              },
            },
          },
          responses: {
            200: {
              description: 'Conversación existente recuperada',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      data: { $ref: '#/components/schemas/ChatConversationDto' },
                    },
                  },
                },
              },
            },
            201: {
              description: 'Nueva conversación creada exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 201 },
                      data: { $ref: '#/components/schemas/ChatConversationDto' },
                    },
                  },
                },
              },
            },
            400: { description: 'peerId inválido o intento de chatear consigo mismo' },
            401: { description: 'No autenticado' },
            404: { description: 'Destinatario o proyecto no encontrado' },
          },
        },
      },
      '/api/v1/chats/{conversationId}/messages': {
        get: {
          tags: ['Chats'],
          summary: 'Obtener historial de mensajes paginado de una conversación',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'conversationId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID de la conversación',
            },
            {
              name: 'page',
              in: 'query',
              required: false,
              schema: { type: 'integer', default: 1, example: 1 },
              description: 'Número de página',
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: { type: 'integer', default: 50, example: 50 },
              description: 'Mensajes por página',
            },
          ],
          responses: {
            200: {
              description: 'Historial de mensajes obtenido exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      data: {
                        type: 'object',
                        properties: {
                          conversation: { $ref: '#/components/schemas/ChatConversationDto' },
                          messages: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/ChatMessageDto' },
                          },
                          pagination: {
                            type: 'object',
                            properties: {
                              page: { type: 'integer', example: 1 },
                              limit: { type: 'integer', example: 50 },
                              total: { type: 'integer', example: 120 },
                              totalPages: { type: 'integer', example: 3 },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'No autenticado' },
            403: { description: 'No pertenece a la conversación' },
            404: { description: 'Conversación no encontrada' },
          },
        },
        post: {
          tags: ['Chats'],
          summary: 'Enviar mensaje de texto a la conversación (emite evento Socket.io)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'conversationId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID de la conversación',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChatSendMessageRequestDto' },
              },
            },
          },
          responses: {
            201: {
              description: 'Mensaje persistido y emitido en tiempo real',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 201 },
                      data: { $ref: '#/components/schemas/ChatMessageDto' },
                    },
                  },
                },
              },
            },
            400: { description: 'Mensaje vacío o supera el límite de 2000 caracteres' },
            401: { description: 'No autenticado' },
            403: { description: 'No pertenece a la conversación' },
            404: { description: 'Conversación no encontrada' },
          },
        },
      },
      '/api/v1/chats/{conversationId}/attachments': {
        post: {
          tags: ['Chats'],
          summary: 'Subir archivo o imagen al chat',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'conversationId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID de la conversación',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: {
                      type: 'string',
                      format: 'binary',
                      description: 'Archivo de imagen o documento adjunto',
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Adjunto subido y emitido como mensaje en el chat',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 201 },
                      data: { $ref: '#/components/schemas/ChatMessageDto' },
                    },
                  },
                },
              },
            },
            400: { description: 'Archivo inválido o ausente' },
            401: { description: 'No autenticado' },
            403: { description: 'No pertenece a la conversación' },
            404: { description: 'Conversación no encontrada' },
          },
        },
      },
      '/api/v1/chats/{conversationId}/read': {
        patch: {
          tags: ['Chats'],
          summary: 'Marcar como leídos los mensajes recibidos en una conversación',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'conversationId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID de la conversación',
            },
          ],
          responses: {
            200: {
              description: 'Mensajes marcados como leídos',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      data: {
                        type: 'object',
                        properties: {
                          updatedCount: { type: 'integer', example: 4 },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'No autenticado' },
            403: { description: 'No pertenece a la conversación' },
            404: { description: 'Conversación no encontrada' },
          },
        },
      },
      '/api/v1/contracts': {
        get: {
          tags: ['Contracts & Escrow'],
          summary: 'Listar contratos activos del usuario autenticado (Cliente o Freelancer)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Lista de contratos del usuario',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ContractDto' },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'No autenticado' },
          },
        },
        post: {
          tags: ['Contracts & Escrow'],
          summary: 'Formalizar contrato en estado DRAFT a partir de una propuesta aceptada',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateContractRequestDto' },
              },
            },
          },
          responses: {
            201: {
              description: 'Contrato creado en estado DRAFT. Listo para fondear Escrow.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 201 },
                      message: { type: 'string', example: 'Contrato formalizado en estado DRAFT. Fondea el Escrow para iniciar.' },
                      data: { $ref: '#/components/schemas/ContractDto' },
                    },
                  },
                },
              },
            },
            400: { description: 'ID de propuesta inválido o propuesta no disponible' },
            401: { description: 'No autenticado' },
            403: { description: 'Solo clientes pueden formalizar contratos' },
          },
        },
      },
      '/api/v1/contracts/{id}': {
        get: {
          tags: ['Contracts & Escrow'],
          summary: 'Obtener detalle completo de un contrato con sus hitos de entrega',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID del contrato',
            },
          ],
          responses: {
            200: {
              description: 'Detalle del contrato e hitos',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      data: { $ref: '#/components/schemas/ContractDto' },
                    },
                  },
                },
              },
            },
            401: { description: 'No autenticado' },
            404: { description: 'Contrato no encontrado' },
          },
        },
      },
      '/api/v1/contracts/{id}/fund': {
        post: {
          tags: ['Contracts & Escrow'],
          summary: 'Retener fondos del cliente en custodia Escrow (DRAFT -> FUNDED)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID del contrato a fondear',
            },
          ],
          responses: {
            200: {
              description: 'Fondos retenidos en Escrow exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      message: { type: 'string', example: 'Fondos retenidos en custodia Escrow exitosamente (Estado: FUNDED).' },
                      data: { $ref: '#/components/schemas/ContractDto' },
                    },
                  },
                },
              },
            },
            400: { description: 'Saldo insuficiente en billetera o estado inválido' },
            401: { description: 'No autenticado' },
            403: { description: 'Solo el cliente propietario puede fondear el contrato' },
          },
        },
      },
      '/api/v1/contracts/{id}/progress': {
        post: {
          tags: ['Contracts & Escrow'],
          summary: 'Iniciar o avanzar el desarrollo del contrato (FUNDED -> IN_PROGRESS)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID del contrato',
            },
          ],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    milestoneId: { type: 'string', format: 'uuid', example: 'd1de5008-8ec6-47b4-863f-45ab9c553847' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Estado del contrato o hito actualizado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      message: { type: 'string', example: 'Avance de contrato actualizado.' },
                      data: { $ref: '#/components/schemas/ContractDto' },
                    },
                  },
                },
              },
            },
            400: { description: 'El contrato debe estar fondeado (FUNDED) para iniciar' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso no autorizado' },
          },
        },
      },
      '/api/v1/proposals': {
        post: {
          tags: ['Proposals'],
          summary: 'Enviar una propuesta económica por hitos a una convocatoria',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateProposalRequestDto' },
              },
            },
          },
          responses: {
            201: {
              description: 'Propuesta registrada exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 201 },
                      data: { $ref: '#/components/schemas/ProposalDto' },
                    },
                  },
                },
              },
            },
            400: { description: 'Datos inválidos o la suma de hitos no coincide con el total' },
            401: { description: 'No autenticado' },
            403: { description: 'Solo freelancers pueden enviar propuestas' },
            429: { description: 'Límite máximo de propuestas por hora alcanzado' },
          },
        },
      },
      '/api/v1/proposals/project/{projectId}': {
        get: {
          tags: ['Proposals'],
          summary: 'Consultar las propuestas recibidas para una convocatoria',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'projectId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID de la convocatoria',
            },
          ],
          responses: {
            200: {
              description: 'Lista de propuestas recibidas',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ProposalDto' },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/api/v1/wallet': {
        get: {
          tags: ['Wallet'],
          summary: 'Consultar balance disponible, saldo en custodia Escrow e historial de transacciones',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Resumen de balance y transacciones de la billetera',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      data: { $ref: '#/components/schemas/WalletBalanceDto' },
                    },
                  },
                },
              },
            },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/api/v1/wallet/deposit': {
        post: {
          tags: ['Wallet'],
          summary: 'Abonar saldo a la billetera digital',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WalletDepositRequestDto' },
              },
            },
          },
          responses: {
            200: {
              description: 'Depósito registrado exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      message: { type: 'string', example: 'Fondos agregados correctamente' },
                      data: { $ref: '#/components/schemas/WalletBalanceDto' },
                    },
                  },
                },
              },
            },
            400: { description: 'Monto inválido' },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/api/v1/wallet/withdraw': {
        post: {
          tags: ['Wallet'],
          summary: 'Solicitar retiro SPEI a cuenta CLABE de 18 dígitos',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WalletWithdrawRequestDto' },
              },
            },
          },
          responses: {
            200: {
              description: 'Orden de retiro procesada exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      message: { type: 'string', example: 'Retiro procesado exitosamente' },
                      data: { $ref: '#/components/schemas/WalletBalanceDto' },
                    },
                  },
                },
              },
            },
            400: { description: 'Saldo insuficiente o CLABE interbancaria no válida' },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/api/v1/wallet/credit-escrow': {
        post: {
          tags: ['Wallet'],
          summary: 'Acreditar pago liberado al freelancer aplicando el 10% de Service Fee de la plataforma',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['freelancerId', 'grossAmount'],
                  properties: {
                    freelancerId: { type: 'string', format: 'uuid', example: 'c9f39300-fdc1-4612-9a5b-65a8bc235c55' },
                    grossAmount: { type: 'number', example: 500.0 },
                    contractId: { type: 'string', format: 'uuid', example: 'e1de5008-8ec6-47b4-863f-45ab9c553847' },
                    description: { type: 'string', example: 'Pago por hito aprobado' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Monto neto acreditado descontando el 10% de comisión',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      data: {
                        type: 'object',
                        properties: {
                          grossAmount: { type: 'number', example: 500.0 },
                          serviceFee: { type: 'number', example: 50.0 },
                          netAmount: { type: 'number', example: 450.0 },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: { description: 'Monto inválido' },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/api/v1/skills': {
        get: {
          tags: ['Skills'],
          summary: 'Obtener el catálogo global de habilidades técnicas',
          responses: {
            200: {
              description: 'Listado completo de habilidades ordenadas alfabéticamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/SkillDto' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/profile/onboarding-status': {
        get: {
          tags: ['Profile'],
          summary: 'Obtener el porcentaje y estado del onboarding de 3 pasos',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Estado detallado de los pasos completados',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      data: {
                        type: 'object',
                        properties: {
                          totalSteps: { type: 'integer', example: 3 },
                          completedSteps: { type: 'integer', example: 2 },
                          percentage: { type: 'integer', example: 67 },
                          isFullyCompleted: { type: 'boolean', example: false },
                          steps: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string', example: 'professional_info' },
                                isCompleted: { type: 'boolean', example: true },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/api/v1/profile/me': {
        get: {
          tags: ['Profile'],
          summary: 'Obtener el perfil completo del usuario autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Perfil completo con biografía, tarifa por hora, portafolio y habilidades',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'integer', example: 200 },
                      data: { $ref: '#/components/schemas/UserProfileDto' },
                    },
                  },
                },
              },
            },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/api/v1/profile/professional-info': {
        put: {
          tags: ['Profile'],
          summary: 'Actualizar información profesional (Paso 1 del Onboarding)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string', example: 'Paulo' },
                    lastName: { type: 'string', example: 'Essau' },
                    bio: { type: 'string', example: 'Ingeniero de software con pasión por el código limpio.' },
                    phone: { type: 'string', example: '+52 55 1234 5678' },
                    professionalTitle: { type: 'string', example: 'Senior Backend Engineer' },
                    hourlyRate: { type: 'number', example: 45.0 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Información profesional actualizada' },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/api/v1/profile/portfolio': {
        post: {
          tags: ['Profile'],
          summary: 'Agregar proyecto al portafolio (Paso 2 del Onboarding)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'description'],
                  properties: {
                    title: { type: 'string', example: 'FreelancerHub Platform' },
                    description: { type: 'string', example: 'Plataforma para freelancers con pagos escrow' },
                    projectUrl: { type: 'string', example: 'https://github.com/freelancerhub' },
                    imageUrl: { type: 'string', example: 'https://storage.../portfolio.jpg' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Proyecto agregado al portafolio' },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/api/v1/profile/portfolio/{itemId}': {
        delete: {
          tags: ['Profile'],
          summary: 'Eliminar un proyecto del portafolio',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'itemId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'ID del ítem a eliminar',
            },
          ],
          responses: {
            200: { description: 'Ítem eliminado correctamente' },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/api/v1/profile/skills': {
        put: {
          tags: ['Profile'],
          summary: 'Actualizar lista de habilidades del perfil (Paso 3 del Onboarding)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['skills'],
                  properties: {
                    skills: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Habilidades actualizadas exitosamente' },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/api/v1/profile/{userId}': {
        get: {
          tags: ['Profile'],
          summary: 'Obtener perfil público de cualquier usuario por su ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'userId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID de usuario',
            },
          ],
          responses: {
            200: { description: 'Perfil público obtenido exitosamente' },
            401: { description: 'No autenticado' },
            404: { description: 'Perfil no encontrado' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
