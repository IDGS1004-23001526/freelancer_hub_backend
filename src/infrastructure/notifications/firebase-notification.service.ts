import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { prisma } from '../persistence/prisma/prisma.client.js';
import { ILogger } from '../../application/interfaces/logger.interface.js';

export interface PushNotificationPayload {
  recipientId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class FirebaseNotificationService {
  private isInitialized = false;
  private firebaseApp?: App;
  private logger?: ILogger;

  constructor(options?: { logger?: ILogger }) {
    this.logger = options?.logger;
    this.initFirebase();
  }

  private initFirebase(): void {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      this.firebaseApp = existingApps[0];
      this.isInitialized = true;
      return;
    }

    try {
      const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
      const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const defaultKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');

      if (serviceAccountRaw) {
        let credsObj: any;
        if (serviceAccountRaw.trim().startsWith('{')) {
          credsObj = JSON.parse(serviceAccountRaw);
        } else if (fs.existsSync(serviceAccountRaw)) {
          const fileContent = fs.readFileSync(serviceAccountRaw, 'utf-8');
          credsObj = JSON.parse(fileContent);
        }

        if (credsObj) {
          this.firebaseApp = initializeApp({
            credential: cert(credsObj),
          });
          this.isInitialized = true;
          this.logger?.info('Firebase Admin inicializado exitosamente con FIREBASE_SERVICE_ACCOUNT', {
            context: 'NOTIFICATIONS:FIREBASE',
          });
          return;
        }
      }

      if (fs.existsSync(defaultKeyPath)) {
        const fileContent = fs.readFileSync(defaultKeyPath, 'utf-8');
        const credsObj = JSON.parse(fileContent);
        this.firebaseApp = initializeApp({
          credential: cert(credsObj),
        });
        this.isInitialized = true;
        this.logger?.info('Firebase Admin inicializado exitosamente desde serviceAccountKey.json', {
          context: 'NOTIFICATIONS:FIREBASE',
        });
        return;
      }

      if (googleAppCreds && fs.existsSync(googleAppCreds)) {
        this.firebaseApp = initializeApp({
          credential: applicationDefault(),
        });
        this.isInitialized = true;
        this.logger?.info('Firebase Admin inicializado con GOOGLE_APPLICATION_CREDENTIALS', {
          context: 'NOTIFICATIONS:FIREBASE',
        });
        return;
      }

      // Inicialización por defecto si hay variables de Google Cloud o emulador
      try {
        this.firebaseApp = initializeApp();
        this.isInitialized = true;
      } catch {
        this.isInitialized = false;
        this.logger?.warn(
          'Firebase Admin en modo simulación (configura FIREBASE_SERVICE_ACCOUNT o GOOGLE_APPLICATION_CREDENTIALS para producción)',
          { context: 'NOTIFICATIONS:FIREBASE' }
        );
      }
    } catch (error: any) {
      this.isInitialized = false;
      this.logger?.warn(
        `Aviso: No se pudo conectar Firebase Admin (${error?.message ?? error}). Se continuará en modo simulación.`,
        { context: 'NOTIFICATIONS:FIREBASE' }
      );
    }
  }

  /**
   * Guarda o actualiza el FCM Device Token de un usuario en la base de datos.
   */
  public async registerToken(userId: string, fcmToken: string): Promise<boolean> {
    try {
      if (!userId || !fcmToken) return false;

      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken: fcmToken.trim() },
      });

      this.logger?.info('FCM Token registrado para el usuario', {
        context: 'NOTIFICATIONS:FIREBASE',
        action: 'REGISTER_TOKEN',
        userId,
      });
      return true;
    } catch (error: any) {
      this.logger?.error('Error registrando FCM token', error, {
        context: 'NOTIFICATIONS:FIREBASE',
        action: 'REGISTER_TOKEN_ERROR',
        userId,
      });
      return false;
    }
  }

  /**
   * Elimina el FCM Token del usuario (por ejemplo, al cerrar sesión).
   */
  public async removeToken(userId: string): Promise<boolean> {
    try {
      if (!userId) return false;

      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken: null },
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Envía una notificación push FCM al dispositivo del destinatario
   * para despertar el teléfono en segundo plano o con la app completamente cerrada.
   */
  public async sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
    const { recipientId, title, body, data } = payload;
    if (!recipientId) return false;

    try {
      const user = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { id: true, fcmToken: true },
      });

      if (!user || !user.fcmToken) {
        // El usuario no tiene un dispositivo registrado aún con token push
        return false;
      }

      if (!this.isInitialized || !this.firebaseApp) {
        this.logger?.info(
          `[SIMULACIÓN FCM] Notificación push para usuario ${recipientId}: "${title}" - "${body}"`,
          { context: 'NOTIFICATIONS:FIREBASE', data }
        );
        return true;
      }

      const stringifiedData: Record<string, string> = {};
      if (data) {
        for (const [key, val] of Object.entries(data)) {
          stringifiedData[key] = val != null ? String(val) : '';
        }
      }

      await getMessaging(this.firebaseApp).send({
        token: user.fcmToken,
        notification: {
          title,
          body,
        },
        data: stringifiedData,
        android: {
          priority: 'high',
          notification: {
            channelId: 'chat_messages',
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      });

      this.logger?.info('Notificación Push enviada exitosamente vía FCM', {
        context: 'NOTIFICATIONS:FIREBASE',
        action: 'SEND_PUSH_SUCCESS',
        recipientId,
        title,
      });

      return true;
    } catch (error: any) {
      // Manejar tokens inválidos o expirados para no seguir enviando a tokens muertos
      const errCode = error?.code || error?.errorInfo?.code;
      if (
        errCode === 'messaging/registration-token-not-registered' ||
        errCode === 'messaging/invalid-registration-token'
      ) {
        await this.removeToken(recipientId);
        this.logger?.warn('Token FCM expirado o inválido; removido de la base de datos', {
          context: 'NOTIFICATIONS:FIREBASE',
          recipientId,
          code: errCode,
        });
      } else {
        this.logger?.error('Error al enviar notificación push vía FCM', error, {
          context: 'NOTIFICATIONS:FIREBASE',
          action: 'SEND_PUSH_ERROR',
          recipientId,
        });
      }
      return false;
    }
  }
}
