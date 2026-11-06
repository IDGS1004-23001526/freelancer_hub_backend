import { v4 as uuidv4 } from 'uuid';
import { IProjectRepository } from '../../domain/repositories/project.repository.interface.js';
import { Project } from '../../domain/entities/project.entity.js';
import { UserRole } from '../../domain/value-objects/user-role.enum.js';
import { ProjectCreationNotAllowedException } from '../../domain/exceptions/domain.exception.js';
import { CreateProjectRequestDto } from '../validation/project.schemas.js';
import { ProjectResponseDto, toProjectDto } from '../dtos/project.dto.js';

/**
 * Caso de Uso: Creación de una convocatoria (proyecto) por un cliente.
 */
export class CreateProjectUseCase {
    constructor(private readonly projectRepository: IProjectRepository) { }

    public async execute(
        clientId: string,
        role: UserRole,
        dto: CreateProjectRequestDto
    ): Promise<ProjectResponseDto> {
        // Autorización de dominio: solo clientes publican convocatorias
        if (role !== UserRole.CLIENT) {
            throw new ProjectCreationNotAllowedException();
        }

        // Creación de la entidad (validaciones fail-fast antes de tocar la BD)
        const project = Project.create({
            id: uuidv4(),
            clientId,
            title: dto.title,
            description: dto.description,
            budget: dto.budget,
            skills: dto.skills,
            estimatedDate: new Date(dto.estimatedDate),
        });

        // Persistencia
        await this.projectRepository.save(project);

        return toProjectDto(project);
    }
}