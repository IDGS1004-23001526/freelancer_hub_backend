import { PrismaClient } from '@prisma/client';
import { IProjectRepository } from '../../../domain/repositories/project.repository.interface.js';
import { Project } from '../../../domain/entities/project.entity.js';

/**
 * Implementación concreta del repositorio de convocatorias con Prisma ORM.
 */
export class PrismaProjectRepository implements IProjectRepository {
    constructor(private readonly prisma: PrismaClient) { }

    public async save(project: Project): Promise<void> {
        await this.prisma.project.create({
            data: {
                id: project.id,
                clientId: project.clientId,
                title: project.title,
                description: project.description,
                budget: project.budget.value,
                estimatedDate: project.estimatedDate,
                status: project.status,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                skills: {
                    create: project.skills.values.map((nombre) => {
                        const slug = this.toSlug(nombre);
                        return {
                            skill: {
                                // El catálogo no tiene seed: si la habilidad no existe, se crea
                                connectOrCreate: {
                                    where: { slug },
                                    create: { name: nombre, slug, category: 'General' },
                                },
                            },
                        };
                    }),
                },
            },
        });
    }

    private toSlug(nombre: string): string {
        return nombre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}