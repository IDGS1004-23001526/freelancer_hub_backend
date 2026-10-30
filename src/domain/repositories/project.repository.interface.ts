import { Project } from "../entities/project.entity.js";

/**
 * Contrato del repositorio de convocatorias 
 */

export interface IProjectRepository {
    /**
     * Persiste una nueva convocatoria junto con sus tags de habilidades
     */
    save(project: Project): Promise<void>;
}