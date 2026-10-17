import { PrismaClient } from '@prisma/client';
import { env } from '../../../config/env.js';

/**
 * Instancia única (Singleton) del cliente de Prisma ORM para gestionar el pool de conexiones
 * a la base de datos PostgreSQL.
 */
class PrismaService {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        datasources: {
          db: {
            url: env.DATABASE_URL,
          },
        },
        log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
      });
    }

    return PrismaService.instance;
  }
}

export const prisma = PrismaService.getInstance();
