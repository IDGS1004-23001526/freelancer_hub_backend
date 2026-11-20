import 'dotenv/config';
import { FirebaseNotificationService } from '../src/infrastructure/notifications/firebase-notification.service.js';
import { getMessaging } from 'firebase-admin/messaging';

async function main() {
  console.log('--- Iniciando prueba de Firebase Notification Service ---');
  console.log('FIREBASE_SERVICE_ACCOUNT en env:', process.env.FIREBASE_SERVICE_ACCOUNT);

  const logs: string[] = [];
  const testLogger = {
    info: (msg: string, meta?: any) => {
      console.log('[LOGGER:INFO]', msg, meta ? JSON.stringify(meta) : '');
      logs.push(`INFO: ${msg}`);
    },
    warn: (msg: string, meta?: any) => {
      console.log('[LOGGER:WARN]', msg, meta ? JSON.stringify(meta) : '');
      logs.push(`WARN: ${msg}`);
    },
    error: (msg: string, err?: any, meta?: any) => {
      console.error('[LOGGER:ERROR]', msg, err?.message || err, meta ? JSON.stringify(meta) : '');
      logs.push(`ERROR: ${msg}`);
    },
    debug: () => {},
  };

  const service = new FirebaseNotificationService({ logger: testLogger });
  const isInitialized = (service as any).isInitialized;
  const app = (service as any).firebaseApp;

  console.log('Estado de inicialización:', isInitialized ? '✅ Conectado' : '❌ No inicializado');

  if (app) {
    console.log('App name:', app.name);
    console.log('Project ID vinculado:', app.options?.projectId || 'Certificado cargado');
    
    const messaging = getMessaging(app);
    console.log('Instancia FCM Messaging:', messaging ? '✅ Lista para procesar mensajes' : '❌ No disponible');

    console.log('--- Probando comunicación real con servidores de Google Firebase (Dry Run) ---');
    try {
      // Usamos dryRun: true para validar credenciales y autorización con Google sin requerir un token activo real
      const testToken = 'fFakeTokenForDryRunValidation1234567890abcdefghijklmnopqrstuvwxyz';
      await messaging.send(
        {
          token: testToken,
          notification: {
            title: 'Test de conectividad',
            body: 'Probando Firebase FCM con freelancer-92fe8',
          },
        },
        true // dryRun flag
      );
      console.log('✅ Google Firebase FCM aceptó la petición (dry run exitoso)');
    } catch (fcmError: any) {
      if (
        fcmError.code === 'messaging/invalid-argument' ||
        fcmError.code === 'messaging/invalid-registration-token' ||
        fcmError.code === 'messaging/registration-token-not-registered'
      ) {
        console.log('✅ Autenticación y comunicación directa con Google FCM v1 API exitosa.');
        console.log('   (Google validó la cuenta de servicio de freelancer-92fe8 y procesó la solicitud).');
      } else {
        console.warn('Respuesta de Google FCM:', fcmError);
      }
    }
  }

  console.log('--- Fin de prueba de inicialización ---');
}

main().catch((err) => {
  console.error('Error en prueba:', err);
  process.exit(1);
});
