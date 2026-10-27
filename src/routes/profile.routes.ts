import { Router, Request, Response } from 'express';
import { InMemoryProfileRepository } from '../infrastructure/persistence/repositories/in-memory-profile.repository.js';
import { Profile } from '../domain/entities/profile.entity.js';
import { createAuthMiddleware } from '../presentation/middlewares/auth.middleware.js';
import { JwtTokenGenerator } from '../infrastructure/security/jwt-token-generator.js';

export const profileRouter = Router();
const profileRepository = new InMemoryProfileRepository();
const authMiddleware = createAuthMiddleware(new JwtTokenGenerator());

// Todas las rutas de perfil requieren autenticación Bearer
profileRouter.use(authMiddleware);

// 1. Obtener estado de onboarding
profileRouter.get('/onboarding-status', async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'default';
  let profile = await profileRepository.findByUserId(userId);
  
  if (!profile) {
    profile = new Profile(userId, '', '');
  }

  const step1 = Boolean(profile.firstName && profile.lastName && profile.professionalTitle && profile.bio && profile.hourlyRate);
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
    },
  });
});

// 2. Obtener perfil completo
profileRouter.get('/me', async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'default';
  const profile = await profileRepository.findByUserId(userId);
  res.json({
    success: true,
    statusCode: 200,
    data: profile || null,
  });
});

// 3. Actualizar información profesional (Paso 1)
profileRouter.put('/professional-info', async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'default';
  let profile = await profileRepository.findByUserId(userId);

  if (!profile) {
    profile = new Profile(userId, req.body.first_name, req.body.last_name);
  }

  profile.updateDetails({
    firstName: req.body.first_name,
    lastName: req.body.last_name,
    bio: req.body.bio,
    phone: req.body.phone,
    professionalTitle: req.body.professionalTitle,
    hourlyRate: req.body.hourlyRate,
  });

  await profileRepository.save(profile);
  res.json({ success: true, statusCode: 200, data: profile });
});

// 4. Agregar ítem al portafolio (Paso 2)
profileRouter.post('/portfolio', async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'default';
  let profile = await profileRepository.findByUserId(userId);

  if (!profile) {
    profile = new Profile(userId, 'Usuario', 'Temporal');
  }

  const newItem = {
    id: `item_${Date.now()}`,
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
    profile.removePortfolioItem(req.params.itemId);
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