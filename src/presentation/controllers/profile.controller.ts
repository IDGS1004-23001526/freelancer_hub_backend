import { Request, Response, NextFunction } from 'express';
import { GetOnboardingStatusUseCase } from '../../application/use-cases/get-onboarding-status.use-case.js';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case.js';
import { UpdateProfessionalInfoUseCase } from '../../application/use-cases/update-professional-info.use-case.js';
import { UpdateSkillsUseCase } from '../../application/use-cases/update-skills.use-case.js';
import { AddPortfolioItemUseCase } from '../../application/use-cases/add-portfolio-item.use-case.js';
import { DeletePortfolioItemUseCase } from '../../application/use-cases/delete-portfolio-item.use-case.js';

export class ProfileController {
  constructor(
    private readonly getOnboardingStatusUseCase: GetOnboardingStatusUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfessionalInfoUseCase: UpdateProfessionalInfoUseCase,
    private readonly updateSkillsUseCase: UpdateSkillsUseCase,
    private readonly addPortfolioItemUseCase: AddPortfolioItemUseCase,
    private readonly deletePortfolioItemUseCase: DeletePortfolioItemUseCase
  ) {}

  /**
   * Obtiene el estado y porcentaje de completitud del onboarding del usuario autenticado
   */
  public getOnboardingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'No autorizado',
        });
        return;
      }

      const status = await this.getOnboardingStatusUseCase.execute(userId);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Estado de onboarding obtenido con éxito.',
        data: status,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene la información de perfil del usuario autenticado
   */
  public getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'No autorizado',
        });
        return;
      }

      const profile = await this.getProfileUseCase.execute(userId);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Perfil de usuario obtenido con éxito.',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualiza la información profesional y biografía del usuario autenticado
   */
  public updateProfessionalInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'No autorizado',
        });
        return;
      }

      const updatedProfile = await this.updateProfessionalInfoUseCase.execute(userId, req.body);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Información profesional actualizada exitosamente.',
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualiza el listado de habilidades técnicas asociadas al perfil
   */
  public updateSkills = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'No autorizado',
        });
        return;
      }

      const updatedProfile = await this.updateSkillsUseCase.execute(userId, req.body);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Habilidades actualizadas exitosamente.',
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Agrega un nuevo proyecto al portafolio
   */
  public addPortfolioItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'No autorizado',
        });
        return;
      }

      const item = await this.addPortfolioItemUseCase.execute(userId, req.body);
      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Proyecto agregado al portafolio exitosamente.',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Elimina un proyecto del portafolio por su ID
   */
  public deletePortfolioItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'No autorizado',
        });
        return;
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Identificador de proyecto no válido.',
        });
        return;
      }

      await this.deletePortfolioItemUseCase.execute(userId, id);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Proyecto eliminado del portafolio exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };
}
