import { IProjectRepository, ProjectSearchParams } from '../../domain/repositories/project.repository.interface.js';
import { ProjectResponseDto, toProjectDto } from '../dtos/project.dto.js';
import { ProjectStatus } from '../../domain/entities/project.entity.js';

export interface PaginatedProjectsResult {
    projects: ProjectResponseDto[];
    meta: {
        total: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}

/**
 * Caso de Uso: Consulta y filtrado de proyectos activos en el feed
 */
export class GetProjectsUseCase {
    constructor(private readonly projectRepository: IProjectRepository) {}

    public async execute(params: ProjectSearchParams): Promise<PaginatedProjectsResult> {
        const page = Math.max(1, params.page || 1);
        const limit = Math.max(1, Math.min(50, params.limit || 10));

        const result = await this.projectRepository.findMany({
            ...params,
            page,
            limit,
            status: ProjectStatus.ACTIVE,
        });

        const totalPages = Math.ceil(result.total / limit);

        return {
            projects: result.projects.map(toProjectDto),
            meta: {
                total: result.total,
                totalPages,
                currentPage: page,
                limit,
            },
        };
    }
}
