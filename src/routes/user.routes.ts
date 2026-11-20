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
      Container.logger.warn('Intento de consulta de perfil sin autenticación', {
        context: 'USER:PROFILE',
        action: 'GET_PROFILE_UNAUTHORIZED',
        statusCode: 401,
      });
      return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
    }

    let profile = await Container.profileRepository.findByUserId(userId);

    // Si aún no existe el perfil, lo pre-inicializamos con el nombre real del usuario
    if (!profile) {
      const user = await Container.userRepository.findById(userId);
      const fullName = user?.fullName || '';
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      profile = new Profile(
        userId,
        firstName,
        lastName,
        '',
        '',
        undefined,
        '',
        undefined,
        [],
        [],
        ''
      );
    }

    const cleanSkills = (profile.skills || []).map((s: any) =>
      typeof s === 'string' ? s : s?.name || ''
    ).filter(Boolean);

    Container.logger.info('Perfil de usuario consultado exitosamente', {
      context: 'USER:PROFILE',
      action: 'GET_PROFILE',
      statusCode: 200,
      userId,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: {
        ...profile,
        firstName: profile.firstName,
        lastName: profile.lastName,
        first_name: profile.firstName,
        last_name: profile.lastName,
        location: profile.location ?? '',
        skills: cleanSkills,
      },
    });
  } catch (error: any) {
    Container.logger.error('Error al obtener perfil de usuario', error, {
      context: 'USER:PROFILE',
      action: 'GET_PROFILE_ERROR',
      statusCode: 500,
      userId: req.user?.sub,
    });
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
      Container.logger.warn('Intento de actualización de perfil sin autenticación', {
        context: 'USER:PROFILE',
        action: 'UPDATE_PROFILE_UNAUTHORIZED',
        statusCode: 401,
      });
      return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
    }

    const updatedProfile = await Container.updateProfileUseCase.execute(userId, req.body);

    const cleanSkills = (updatedProfile.skills || []).map((s: any) =>
      typeof s === 'string' ? s : s?.name || ''
    ).filter(Boolean);

    Container.logger.info('Perfil de usuario actualizado exitosamente', {
      context: 'USER:PROFILE',
      action: 'UPDATE_PROFILE',
      statusCode: 200,
      userId,
    });

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
        location: updatedProfile.location ?? req.body?.location ?? '',
        skills: cleanSkills,
      },
    });
  } catch (error: any) {
    Container.logger.warn('Error de validación al actualizar perfil de usuario', {
      context: 'USER:PROFILE',
      action: 'UPDATE_PROFILE_WARN',
      statusCode: 400,
      userId: req.user?.sub,
      error: error.message,
    });
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
        Container.logger.warn('Intento de subida de avatar sin autenticación', {
          context: 'USER:AVATAR',
          action: 'UPLOAD_AVATAR_UNAUTHORIZED',
          statusCode: 401,
        });
        return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
      }

      if (!req.file) {
        Container.logger.warn('Intento de subida de avatar sin archivo', {
          context: 'USER:AVATAR',
          action: 'UPLOAD_AVATAR_NO_FILE',
          statusCode: 400,
          userId,
        });
        return res.status(400).json({ success: false, statusCode: 400, message: 'Archivo de imagen requerido' });
      }

      const avatarUrl = await Container.uploadAvatarUseCase.execute(
        userId,
        req.file.buffer,
        req.file.originalname
      );

      Container.realtimeServer.emitProfileUpdated(userId, { avatarUrl });

      Container.logger.info('Avatar de usuario actualizado exitosamente', {
        context: 'USER:AVATAR',
        action: 'UPLOAD_AVATAR',
        statusCode: 201,
        userId,
        avatarUrl,
      });

      return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Avatar actualizado correctamente',
        data: { avatarUrl },
      });
    } catch (error: any) {
      Container.logger.error('Error al cargar imagen de avatar', error, {
        context: 'USER:AVATAR',
        action: 'UPLOAD_AVATAR_ERROR',
        statusCode: 500,
        userId: req.user?.sub,
      });
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
      Container.logger.warn('Intento de consulta de habilidades sin autenticación', {
        context: 'USER:SKILLS',
        action: 'GET_SKILLS_UNAUTHORIZED',
        statusCode: 401,
      });
      return res.status(401).json({ success: false, statusCode: 401, message: 'Usuario no autenticado' });
    }

    const profile = await Container.profileRepository.findByUserId(userId);
    const skills = (profile?.skills || []).map((s: any) =>
      typeof s === 'string' ? { name: s } : s
    );

    Container.logger.info('Habilidades del usuario consultadas', {
      context: 'USER:SKILLS',
      action: 'GET_SKILLS',
      statusCode: 200,
      userId,
      skillsCount: skills.length,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: skills,
    });
  } catch (error: any) {
    Container.logger.error('Error al consultar habilidades de usuario', error, {
      context: 'USER:SKILLS',
      action: 'GET_SKILLS_ERROR',
      statusCode: 500,
      userId: req.user?.sub,
    });
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
      Container.logger.warn('Intento de agregar habilidad con nombre inválido', {
        context: 'USER:SKILLS',
        action: 'ADD_SKILL_INVALID',
        statusCode: 400,
        userId,
      });
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

    Container.logger.info('Nueva habilidad agregada al perfil del usuario', {
      context: 'USER:SKILLS',
      action: 'ADD_SKILL',
      statusCode: 201,
      userId,
      skill: skillName.trim(),
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Habilidad agregada correctamente al perfil',
      data: { name: skillName.trim(), skills: currentSkills },
    });
  } catch (error: any) {
    Container.logger.error('Error al agregar habilidad de usuario', error, {
      context: 'USER:SKILLS',
      action: 'ADD_SKILL_ERROR',
      statusCode: 500,
      userId: req.user?.sub,
    });
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

    Container.logger.info('Habilidad eliminada del perfil del usuario', {
      context: 'USER:SKILLS',
      action: 'REMOVE_SKILL',
      statusCode: 200,
      userId,
      skill: identifier,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Habilidad eliminada correctamente del perfil',
    });
  } catch (error: any) {
    Container.logger.error('Error al eliminar habilidad de usuario', error, {
      context: 'USER:SKILLS',
      action: 'REMOVE_SKILL_ERROR',
      statusCode: 500,
      userId: req.user?.sub,
    });
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

    Container.logger.info('Conjunto de habilidades del usuario actualizado', {
      context: 'USER:SKILLS',
      action: 'UPDATE_ALL_SKILLS',
      statusCode: 200,
      userId,
      skillsCount: skills.length,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Habilidades actualizadas exitosamente',
      data: skills,
    });
  } catch (error: any) {
    Container.logger.error('Error al actualizar habilidades de usuario', error, {
      context: 'USER:SKILLS',
      action: 'UPDATE_ALL_SKILLS_ERROR',
      statusCode: 500,
      userId: req.user?.sub,
    });
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al actualizar habilidades',
    });
  }
});

