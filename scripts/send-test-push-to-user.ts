import 'dotenv/config';
import { prisma } from '../src/infrastructure/persistence/prisma/prisma.client.js';
import { FirebaseNotificationService } from '../src/infrastructure/notifications/firebase-notification.service.js';

async function main() {
  const targetEmail = 'christoferriveravalderrama@gmail.com';
  console.log(`Buscando usuario en base de datos: ${targetEmail}`);

  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    select: {
      id: true,
      email: true,
      fcmToken: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    console.log(`❌ No se encontró ningún usuario con el correo: ${targetEmail}`);
    const totalUsers = await prisma.user.count();
    console.log(`Total de usuarios registrados en la base de datos actual: ${totalUsers}`);
    const sampleUsers = await prisma.user.findMany({
      take: 5,
      select: { email: true, fcmToken: true },
    });
    console.log('Muestra de usuarios en la base de datos:', sampleUsers);
    return;
  }

  console.log(`✅ Usuario encontrado:`, {
    id: user.id,
    email: user.email,
    tieneFcmToken: !!user.fcmToken,
    fcmTokenSnippet: user.fcmToken ? `${user.fcmToken.slice(0, 15)}...` : 'Ninguno registrado',
  });

  if (!user.fcmToken) {
    console.log(`⚠️ El usuario ${targetEmail} no tiene un 'fcmToken' registrado en la base de datos.`);
    console.log(`Para recibir notificaciones push en su dispositivo, el usuario debe haber iniciado sesión desde la app móvil o web y registrado su token en /api/v1/users/fcm-token.`);
    return;
  }

  console.log('Enviando notificación push de prueba vía Firebase...');
  const service = new FirebaseNotificationService({
    logger: {
      info: (msg, meta) => console.log('[INFO]', msg, meta || ''),
      warn: (msg, meta) => console.log('[WARN]', msg, meta || ''),
      error: (msg, err, meta) => console.error('[ERROR]', msg, err, meta || ''),
      debug: () => {},
    },
  });

  const success = await service.sendPushNotification({
    recipientId: user.id,
    title: '🔔 Notificación de prueba FreelancerHub',
    body: '¡Hola Christofer! Tu conexión con Firebase Cloud Messaging está funcionando perfectamente.',
    data: {
      type: 'TEST_NOTIFICATION',
      sentAt: new Date().toISOString(),
    },
  });

  console.log('Resultado del envío:', success ? '🚀 ENVIADA CON ÉXITO' : '❌ FALLÓ EL ENVÍO');
}

main()
  .catch((err) => console.error('Error:', err))
  .finally(() => prisma.$disconnect());
