import { Router, Request, Response } from 'express';
import { prisma } from '../infrastructure/persistence/prisma/prisma.client.js';

export const internalTeamRouter = Router();

// Endpoint para obtener miembros y contraseñas (SOLO PAULO ADMIN)
internalTeamRouter.get('/members', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    // Validar si quien pide ver las contraseñas es Paulo
    const isPaulo = adminKey === 'paulo_secret_master_key_2026';

    const members = await prisma.internalMember.findMany({
      orderBy: { name: 'asc' },
    });

    const data = members.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      password: isPaulo ? m.password : undefined, // Solo Paulo ve las contraseñas en texto
      isConfigured: Boolean(m.password && m.password.length > 0),
      createdAt: m.createdAt,
    }));

    res.json({
      success: true,
      statusCode: 200,
      data,
      isPaulo,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint para identificarse / configurar contraseña
internalTeamRouter.post('/auth', async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({ success: false, message: 'El nombre es obligatorio.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 3) {
      res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 3 caracteres.' });
      return;
    }

    const cleanName = name.trim();
    let member = await prisma.internalMember.findUnique({
      where: { name: cleanName },
    });

    // Caso 1: Miembro no existe -> Se registra por primera vez y define su contraseña
    if (!member) {
      member = await prisma.internalMember.create({
        data: {
          name: cleanName,
          password: password.trim(),
          role: cleanName.toLowerCase() === 'paulo' ? 'ADMIN' : 'DEV',
        },
      });

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: `¡Bienvenido ${member.name}! Tu contraseña quedó guardada.`,
        data: {
          id: member.id,
          name: member.name,
          role: member.role,
        },
      });
      return;
    }

    // Caso 2: El miembro ya existe -> Validar contraseña ingresada
    if (member.password !== password.trim()) {
      res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Contraseña incorrecta. Si la olvidaste, pídesela a Paulo (Admin).',
      });
      return;
    }

    res.json({
      success: true,
      statusCode: 200,
      message: `Hola de nuevo, ${member.name}.`,
      data: {
        id: member.id,
        name: member.name,
        role: member.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
