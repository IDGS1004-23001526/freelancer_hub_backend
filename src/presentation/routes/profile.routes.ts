import { Router } from 'express';
import { Container } from '../../container.js';
import { validateBody } from '../middlewares/validate-request.middleware.js';
import {
  updateProfessionalInfoSchema,
  updateSkillsSchema,
  portfolioItemSchema,
} from '../../application/validation/profile.schemas.js';

export const profileRouter = Router();

/**
 * @ruta GET /api/v1/profile/onboarding-status
 * @descripcion Obtiene el progreso del onboarding del usuario autenticado
 * @acceso Protegido (Bearer JWT)
 */
profileRouter.get(
  '/onboarding-status',
  Container.authMiddleware,
  Container.profileController.getOnboardingStatus
);

/**
 * @ruta GET /api/v1/profile/me
 * @descripcion Obtiene la información del perfil del usuario autenticado
 * @acceso Protegido (Bearer JWT)
 */
profileRouter.get(
  '/me',
  Container.authMiddleware,
  Container.profileController.getMyProfile
);

/**
 * @ruta PUT /api/v1/profile/professional-info
 * @descripcion Actualiza la información profesional y tarifa del usuario autenticado
 * @acceso Protegido (Bearer JWT)
 */
profileRouter.put(
  '/professional-info',
  Container.authMiddleware,
  validateBody(updateProfessionalInfoSchema),
  Container.profileController.updateProfessionalInfo
);

/**
 * @ruta PUT /api/v1/profile/skills
 * @descripcion Actualiza las habilidades asociadas al perfil del usuario autenticado
 * @acceso Protegido (Bearer JWT)
 */
profileRouter.put(
  '/skills',
  Container.authMiddleware,
  validateBody(updateSkillsSchema),
  Container.profileController.updateSkills
);

/**
 * @ruta POST /api/v1/profile/portfolio
 * @descripcion Agrega un nuevo proyecto al portafolio
 * @acceso Protegido (Bearer JWT)
 */
profileRouter.post(
  '/portfolio',
  Container.authMiddleware,
  validateBody(portfolioItemSchema),
  Container.profileController.addPortfolioItem
);

/**
 * @ruta DELETE /api/v1/profile/portfolio/:id
 * @descripcion Elimina un proyecto del portafolio por su identificador
 * @acceso Protegido (Bearer JWT)
 */
profileRouter.delete(
  '/portfolio/:id',
  Container.authMiddleware,
  Container.profileController.deletePortfolioItem
);

