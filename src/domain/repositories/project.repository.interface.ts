import { Project, ProjectStatus } from "../entities/project.entity.js";

export interface ProjectSearchParams {
    query?: string;
    category?: string;
    skillSlug?: string;
    minBudget?: number;
    maxBudget?: number;
    status?: ProjectStatus;
    page?: number;
    limit?: number;
}

export interface ProjectSearchResult {
    projects: Project[];
    total: number;
}

/**
 * Contrato del repositorio de convocatorias 
 */
export interface IProjectRepository {
    /**
     * Persiste una nueva convocatoria junto con sus tags de habilidades
     */
    save(project: Project): Promise<void>;

    /**
     * Busca y filtra convocatorias en el feed usando índices optimizados (B-Tree y Full-Text)
     */
    findMany(params: ProjectSearchParams): Promise<ProjectSearchResult>;
}