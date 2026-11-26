import { Request, Response, NextFunction } from 'express';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case.js';
import { GetProjectsUseCase } from '../../application/use-cases/get-projects.use-case.js';
import { InvalidTokenException } from '../../domain/exceptions/domain.exception.js';
import { Container } from '../../container.js';

export class ProjectController {
    constructor(
        private readonly createProjectUseCase: CreateProjectUseCase,
        private readonly getProjectsUseCase: GetProjectsUseCase
    ) { }

    /**
     * Consulta y filtra convocatorias activas para el feed
     */
    public getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const query = req.query as any;
            const result = await this.getProjectsUseCase.execute({
                search: query.search,
                category: query.category,
                minBudget: query.minBudget,
                maxBudget: query.maxBudget,
                skills: query.skills,
                page: query.page,
                limit: query.limit,
            });

            Container.logger.info('Feed de convocatorias consultado', {
                context: 'PROJECT',
                action: 'GET_FEED',
                statusCode: 200,
                resultCount: result.projects.length,
            });

            res.status(200).json({
                success: true,
                statusCode: 200,
                message: 'Convocatorias obtenidas exitosamente',
                data: result.projects,
                meta: result.meta,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Consulta el detalle de una convocatoria individual por ID
     */
    public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const projectId = String(req.params.id);
            const proyecto = await this.getProjectsUseCase.getById(projectId);

            res.status(200).json({
                success: true,
                statusCode: 200,
                data: proyecto,
            });
        } catch (error) {
            next(error);
        }
    };

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

            Container.logger.info('Convocatoria creada exitosamente', {
                context: 'PROJECT',
                action: 'CREATE_PROJECT',
                statusCode: 201,
                userId: claims.sub,
                projectId: proyecto.id,
            });

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