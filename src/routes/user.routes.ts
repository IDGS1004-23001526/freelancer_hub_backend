import { Router, Request, Response } from 'express';
import { Container } from '../container.js';
import { uploadMiddleware } from '../middlewares/multer.middleware.js';
import { Profile } from '../domain/entities/profile.entity.js';

export const usersRouter = Router();

// Todas las rutas requieren autenticación Bearer
usersRouter.use(Container.authMiddleware);

/**
 * @ruta GET /api/v1/users/me/profile
 * @descripcion Obtiene el perfil del usuario autenticado
 */
usersRouter.get('/me/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
    }

    let profile = await Container.profileRepository.findByUserId(userId);

    // Si aún no existe el perfil, lo pre-inicializamos con el nombre del usuario
    if (!profile) {
      const user = await Container.userRepository.findById(userId);
      const fullName = user?.fullName || 'Christopher Isaac Rivera Valderrama';
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0] || 'Christopher';
      const lastName = parts.slice(1).join(' ') || 'Rivera Valderrama';

      profile = new Profile(
        userId,
        firstName,
        lastName,
        'Desarrollador de Software Multiplataforma | Desarrollo Web | React | Node.js | UI/UX Design',
        '+524771234567',
        undefined,
        'Desarrollador de Software Multiplataforma | Desarrollo Web | React | Node.js | UI/UX Design',
        35,
        ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'UI/UX Design', 'Docker']
      );
    }

    const cleanSkills = (profile.skills || []).map((s: any) =>
      typeof s === 'string' ? s : s?.name || ''
    ).filter(Boolean);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: {
        ...profile,
        firstName: profile.firstName,
        lastName: profile.lastName,
        first_name: profile.firstName,
        last_name: profile.lastName,
        skills: cleanSkills,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al obtener el perfil',
    });
  }
});

/**
 * @ruta PUT /api/v1/users/me/profile
 * @descripcion Actualiza o inicializa (Upsert) el perfil del usuario
 */
usersRouter.put('/me/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
    }

    const updatedProfile = await Container.updateProfileUseCase.execute(userId, req.body);

    const cleanSkills = (updatedProfile.skills || []).map((s: any) =>
      typeof s === 'string' ? s : s?.name || ''
    ).filter(Boolean);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Cambios guardados correctamente',
      data: {
        ...updatedProfile,
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        first_name: updatedProfile.firstName,
        last_name: updatedProfile.lastName,
        skills: cleanSkills,
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: error.message || 'Error al actualizar el perfil',
    });
  }
});

/**
 * @ruta POST /api/v1/users/me/avatar
 * @descripcion Carga o actualiza la imagen de perfil
 */
usersRouter.post(
  '/me/avatar',
  uploadMiddleware.single('avatar'),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Archivo de imagen requerido' });
      }

      const avatarUrl = await Container.uploadAvatarUseCase.execute(
        userId,
        req.file.buffer,
        req.file.originalname
      );

      return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Avatar actualizado correctamente',
        data: { avatarUrl },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: error.message || 'Error al cargar imagen de perfil',
      });
    }
  }
);

/**
 * @ruta GET /api/v1/users/me/skills
 * @descripcion Obtiene las habilidades del usuario autenticado
 */
usersRouter.get('/me/skills', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
    }

    const profile = await Container.profileRepository.findByUserId(userId);
    const skills = (profile?.skills || []).map((s: any) =>
      typeof s === 'string' ? { name: s } : s
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: skills,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al consultar habilidades',
    });
  }
});

/**
 * @ruta POST /api/v1/users/me/skills
 * @descripcion Agrega una nueva habilidad al perfil del usuario
 */
usersRouter.post('/me/skills', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
    }

    const skillName = req.body.name || req.body.skill;
    if (!skillName || typeof skillName !== 'string') {
      return res.status(400).json({ success: false, statusCode: 400, message: 'El nombre de la habilidad es requerido' });
    }

    let profile = await Container.profileRepository.findByUserId(userId);
    if (!profile) {
      profile = new Profile(userId, 'Christopher', 'Rivera Valderrama');
    }

    const currentSkills = (profile.skills || []).map((s: any) =>
      typeof s === 'string' ? s : s?.name || ''
    ).filter(Boolean);

    if (!currentSkills.includes(skillName.trim())) {
      currentSkills.push(skillName.trim());
      profile.setSkills(currentSkills);
      await Container.profileRepository.save(profile);
    }

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Habilidad agregada correctamente al perfil',
      data: { name: skillName.trim(), skills: currentSkills },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al agregar habilidad',
    });
  }
});

/**
 * @ruta DELETE /api/v1/users/me/skills/:identifier
 * @descripcion Elimina una habilidad del perfil del usuario
 */
usersRouter.delete('/me/skills/:identifier', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
    }

    const identifier = decodeURIComponent(String(req.params.identifier)).toLowerCase();
    const profile = await Container.profileRepository.findByUserId(userId);

    if (profile) {
      const remainingSkills = (profile.skills || []).filter((s: any) => {
        const name = (typeof s === 'string' ? s : s?.name || s?.id || '').toLowerCase();
        return name !== identifier;
      });

      profile.setSkills(remainingSkills);
      await Container.profileRepository.save(profile);
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Habilidad eliminada correctamente del perfil',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al eliminar habilidad',
    });
  }
});

/**
 * @ruta PUT /api/v1/users/me/skills
 * @descripcion Actualiza el conjunto completo de habilidades del usuario
 */
usersRouter.put('/me/skills', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
    }

    const skills = Array.isArray(req.body.skills) ? req.body.skills : [];
    let profile = await Container.profileRepository.findByUserId(userId);

    if (!profile) {
      profile = new Profile(userId, 'Christopher', 'Rivera Valderrama');
    }

    profile.setSkills(skills);
    await Container.profileRepository.save(profile);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Habilidades actualizadas exitosamente',
      data: skills,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al actualizar habilidades',
    });
  }
});

