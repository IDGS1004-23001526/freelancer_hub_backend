import { Request, Response, NextFunction } from 'express';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case.js';
import { InvalidTokenException } from '../../domain/exceptions/domain.exception.js';
import { success } from 'zod/v4';

export class ProjectController {
    constructor(private readonly createProjectUseCase: CreateProjectUseCase) { }

    /**
     * Crea una nueva convocatoria para el cliente autenticado
     */
    public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) {
                throw new InvalidTokenException();
            }

            const proyecto = await this.createProjectUseCase.execute(claims.sub, claims.role, req.body);

            res.status(201).json({
                success: true,
                statusCode: 201,
                message: 'Convocatoria creada exitosamente',
                data: proyecto,
            });
        } catch (error) {
            next(error);
        }
    };
}