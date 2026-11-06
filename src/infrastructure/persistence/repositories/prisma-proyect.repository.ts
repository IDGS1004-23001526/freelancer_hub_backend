import { PrismaClient, Prisma } from '@prisma/client';
import { IProjectRepository, ProjectSearchParams, ProjectSearchResult } from '../../../domain/repositories/project.repository.interface.js';
import { Project, ProjectStatus } from '../../../domain/entities/project.entity.js';
import { Budget } from '../../../domain/value-objects/budget.vo.js';
import { SkillTags } from '../../../domain/value-objects/skill-tags.vo.js';

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

    /**
     * Busca y filtra convocatorias en el feed aprovechando los índices optimizados
     */
    public async findMany(params: ProjectSearchParams): Promise<ProjectSearchResult> {
        const page = Math.max(1, params.page || 1);
        const limit = Math.max(1, Math.min(50, params.limit || 10));
        const skip = (page - 1) * limit;

        const where: Prisma.ProjectWhereInput = {};

        if (params.status) {
            where.status = params.status;
        }

        if (params.minBudget !== undefined || params.maxBudget !== undefined) {
            where.budget = {};
            if (params.minBudget !== undefined) {
                where.budget.gte = params.minBudget;
            }
            if (params.maxBudget !== undefined) {
                where.budget.lte = params.maxBudget;
            }
        }

        if (params.skillSlug) {
            where.skills = {
                some: {
                    skill: {
                        slug: params.skillSlug.toLowerCase(),
                    },
                },
            };
        }

        if (params.category) {
            where.skills = {
                some: {
                    skill: {
                        category: {
                            equals: params.category,
                            mode: 'insensitive',
                        },
                    },
                },
            };
        }

        if (params.query && params.query.trim()) {
            const cleanQuery = params.query.trim();
            where.OR = [
                { title: { contains: cleanQuery, mode: 'insensitive' } },
                { description: { contains: cleanQuery, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.project.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    skills: {
                        include: {
                            skill: true,
                        },
                    },
                },
            }),
            this.prisma.project.count({ where }),
        ]);

        const domainProjects = items.map((item) => {
            const skillNames = item.skills.map((s) => s.skill.name);
            return new Project({
                id: item.id,
                clientId: item.clientId,
                title: item.title,
                description: item.description,
                budget: new Budget(Number(item.budget)),
                skills: new SkillTags(skillNames.length >= 3 ? skillNames : [...skillNames, 'General', 'Software', 'Tecnología'].slice(0, 3)),
                estimatedDate: item.estimatedDate,
                status: item.status as ProjectStatus,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            });
        });

        return {
            projects: domainProjects,
            total,
        };
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