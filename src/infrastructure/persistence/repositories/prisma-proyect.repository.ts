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

        const andConditions: Prisma.ProjectWhereInput[] = [];

        // 2. Retornar solo proyectos con status 'ACTIVE'
        andConditions.push({
            status: params.status || ProjectStatus.ACTIVE,
        });

        if (params.minBudget !== undefined || params.maxBudget !== undefined) {
            const budgetFilter: Prisma.DecimalFilter = {};
            if (params.minBudget !== undefined) {
                budgetFilter.gte = params.minBudget;
            }
            if (params.maxBudget !== undefined) {
                budgetFilter.lte = params.maxBudget;
            }
            andConditions.push({ budget: budgetFilter });
        }

        // Filtro por skills (array de tags o lista de slugs/nombres)
        const skillTerms: string[] = [];
        if (params.skills && params.skills.length > 0) {
            skillTerms.push(...params.skills);
        }
        if (params.skillSlug && params.skillSlug.trim()) {
            skillTerms.push(params.skillSlug.trim());
        }

        if (skillTerms.length > 0) {
            const slugs = skillTerms.map((s) => this.toSlug(s)).filter(Boolean);
            andConditions.push({
                skills: {
                    some: {
                        skill: {
                            OR: [
                                { slug: { in: slugs } },
                                { name: { in: skillTerms, mode: 'insensitive' } },
                            ],
                        },
                    },
                },
            });
        }

        if (params.category && params.category.trim()) {
            andConditions.push({
                skills: {
                    some: {
                        skill: {
                            category: {
                                equals: params.category.trim(),
                                mode: 'insensitive',
                            },
                        },
                    },
                },
            });
        }

        const rawSearch = (params.search || params.query || '').trim();
        if (rawSearch) {
            andConditions.push({
                OR: [
                    { title: { contains: rawSearch, mode: 'insensitive' } },
                    { description: { contains: rawSearch, mode: 'insensitive' } },
                ],
            });
        }

        const where: Prisma.ProjectWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

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