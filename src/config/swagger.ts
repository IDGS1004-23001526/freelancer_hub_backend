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
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
