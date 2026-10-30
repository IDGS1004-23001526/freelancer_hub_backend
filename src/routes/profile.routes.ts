import crypto from 'node:crypto';
import { Router, Request, Response } from 'express';
import { Profile } from '../domain/entities/profile.entity.js';
import { Container } from '../container.js';
import { uploadMiddleware } from '../middlewares/multer.middleware.js';

export const profileRouter = Router();
const profileRepository = Container.profileRepository;

// Todas las rutas de perfil requieren autenticación Bearer
profileRouter.use(Container.authMiddleware);

// 1. Obtener estado de onboarding
profileRouter.get('/onboarding-status', async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'default';
  let profile = await profileRepository.findByUserId(userId);

  if (!profile) {
    const user = await Container.userRepository.findById(userId);
    const parts = user ? user.fullName.trim().split(/\s+/) : ['Usuario'];
    profile = new Profile(userId, parts[0] || 'Usuario', parts.slice(1).join(' ') || '');
  }

  const step1 = Boolean(
    profile.firstName &&
    profile.lastName &&
    profile.professionalTitle &&
    profile.bio &&
    profile.hourlyRate
  );
  const step2 = Boolean(profile.portfolioItems && profile.portfolioItems.length > 0);
  const step3 = Boolean(profile.skills && profile.skills.length > 0);
  const completed = [step1, step2, step3].filter(Boolean).length;

  res.json({
    success: true,
    statusCode: 200,
    data: {
      totalSteps: 3,
      completedSteps: completed,
      percentage: Math.round((completed / 3) * 100),
      isFullyCompleted: completed === 3,
      steps: [
        { id: 'professional_info', isCompleted: step1 },
        { id: 'portfolio', isCompleted: step2 },
        { id: 'skills', isCompleted: step3 },
      ],
    },
  });
});

// 2. Obtener perfil completo del usuario autenticado
profileRouter.get('/me', async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'default';
  let profile = await profileRepository.findByUserId(userId);

  if (!profile) {
    const user = await Container.userRepository.findById(userId);
    if (user) {
      const parts = user.fullName.trim().split(/\s+/);
      const firstName = parts[0] || 'Usuario';
      const lastName = parts.slice(1).join(' ') || '';
      profile = new Profile(userId, firstName, lastName);
    }
  }

  if (!profile) {
    return res.json({
      success: true,
      statusCode: 200,
      data: null,
    });
  }

  const cleanSkills = (profile.skills || []).map((s: any) =>
    typeof s === 'string' ? s : s?.name || ''
  ).filter(Boolean);

  res.json({
    success: true,
    statusCode: 200,
    data: {
      ...profile,
      first_name: profile.firstName,
      lastName: profile.lastName,
      last_name: profile.lastName,
      skills: cleanSkills,
    },
  });
});

// 3. Actualizar información profesional (Paso 1)
profileRouter.put('/professional-info', async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'default';
  let profile = await profileRepository.findByUserId(userId);

  const firstName = req.body.firstName || req.body.first_name || '';
  const lastName = req.body.lastName || req.body.last_name || '';

  if (!profile) {
    profile = new Profile(userId, firstName, lastName);
  }

  profile.updateDetails({
    firstName,
    lastName,
    bio: req.body.bio,
    phone: req.body.phone,
    professionalTitle: req.body.professionalTitle,
    hourlyRate: req.body.hourlyRate,
  });

  await profileRepository.save(profile);
  res.json({
    success: true,
    statusCode: 200,
    data: {
      ...profile,
      first_name: profile.firstName,
      last_name: profile.lastName,
    },
  });
});

// 4. Agregar ítem al portafolio (Paso 2)
profileRouter.post('/portfolio', async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'default';
  let profile = await profileRepository.findByUserId(userId);

  if (!profile) {
    profile = new Profile(userId, 'Usuario', 'Temporal');
  }

  const newItem = {
    id: crypto.randomUUID(),
    title: req.body.title,
    description: req.body.description,
    projectUrl: req.body.projectUrl,
    imageUrl: req.body.imageUrl,
  };

  profile.addPortfolioItem(newItem);
  await profileRepository.save(profile);
  res.json({ success: true, statusCode: 201, data: newItem });
});

// 5. Eliminar ítem del portafolio
profileRouter.delete('/portfolio/:itemId', async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'default';
  const profile = await profileRepository.findByUserId(userId);

  if (profile) {
    const itemId = String(req.params.itemId);
    profile.removePortfolioItem(itemId);
    await profileRepository.save(profile);
  }

  res.json({ success: true, statusCode: 200, message: 'Eliminado correctamente' });
});

// 6. Actualizar habilidades (Paso 3)
profileRouter.put('/skills', async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'default';
  let profile = await profileRepository.findByUserId(userId);

  if (!profile) {
    profile = new Profile(userId, 'Usuario', 'Temporal');
  }

  profile.setSkills(req.body.skills || []);
  await profileRepository.save(profile);
  res.json({ success: true, statusCode: 200, data: profile });
});

// 7. Subir Avatar / Foto de perfil
profileRouter.post(
  '/avatar',
  uploadMiddleware.single('avatar'),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'No se envió ningún archivo' });
      }

      const avatarUrl = await Container.uploadAvatarUseCase.execute(
        userId,
        req.file.buffer,
        req.file.originalname
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Avatar actualizado exitosamente.',
        data: { avatarUrl },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        message: error.message || 'Error al subir el avatar.',
      });
    }
  }
);

// 8. Obtener perfil público de un usuario por su ID
profileRouter.get('/:userId', async (req: Request, res: Response) => {
  const userId = String(req.params.userId);
  const profile = await profileRepository.findByUserId(userId);
  if (!profile) {
    return res.status(404).json({ success: false, statusCode: 404, message: 'Perfil no encontrado' });
  }
  res.json({ success: true, statusCode: 200, data: profile });
});