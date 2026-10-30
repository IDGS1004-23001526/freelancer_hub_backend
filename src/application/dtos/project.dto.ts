import { Project } from '../../domain/entities/project.entity.js';

export interface ProjectResponseDto {
    id: string;
    clientId: string;
    title: string;
    description: string;
    budget: number;
    skills: string[];
    estimatedDate: string;
    status: string;
    createdAt: string;
}

export const toProjectDto = (project: Project): ProjectResponseDto => ({
    id: project.id,
    clientId: project.clientId,
    title: project.title,
    description: project.description,
    budget: project.budget.value,
    skills: project.skills.values,
    estimatedDate: project.estimatedDate.toISOString(),
    status: project.status,
    createdAt: project.createdAt.toISOString(),
});