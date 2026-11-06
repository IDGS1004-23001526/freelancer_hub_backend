import { PrismaClient } from '@prisma/client';
import { IProposalRepository } from '../../../domain/repositories/proposal.repository.interface.js';
import { Proposal, MilestoneQuote, ProposalStatus } from '../../../domain/entities/proposal.entity.js';

export class PrismaProposalRepository implements IProposalRepository {
    constructor(private readonly prisma: PrismaClient) {}

    public async save(proposal: Proposal): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            await tx.proposal.create({
                data: {
                    id: proposal.id,
                    projectId: proposal.projectId,
                    freelancerId: proposal.freelancerId,
                    coverLetter: proposal.coverLetter,
                    totalPrice: proposal.totalPrice,
                    estimatedDays: proposal.estimatedDays,
                    status: proposal.status,
                    createdAt: proposal.createdAt,
                    updatedAt: proposal.updatedAt,
                    milestones: {
                        create: proposal.milestones.map((m) => ({
                            id: m.id,
                            title: m.title,
                            description: m.description,
                            amount: m.amount,
                            deliveryDays: m.deliveryDays,
                            order: m.order,
                            createdAt: m.createdAt,
                        })),
                    },
                },
            });
        });
    }

    public async findById(id: string): Promise<Proposal | null> {
        const row = await this.prisma.proposal.findUnique({
            where: { id },
            include: { milestones: { orderBy: { order: 'asc' } } },
        });

        if (!row) return null;
        return this.mapToDomain(row);
    }

    public async findByProjectAndFreelancer(
        projectId: string,
        freelancerId: string
    ): Promise<Proposal | null> {
        const row = await this.prisma.proposal.findUnique({
            where: {
                unique_project_freelancer_proposal: {
                    projectId,
                    freelancerId,
                },
            },
            include: { milestones: { orderBy: { order: 'asc' } } },
        });

        if (!row) return null;
        return this.mapToDomain(row);
    }

    public async findByProjectId(projectId: string): Promise<Proposal[]> {
        const rows = await this.prisma.proposal.findMany({
            where: { projectId },
            include: { milestones: { orderBy: { order: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        });

        return rows.map((r) => this.mapToDomain(r));
    }

    public async findByFreelancerId(freelancerId: string): Promise<Proposal[]> {
        const rows = await this.prisma.proposal.findMany({
            where: { freelancerId },
            include: { milestones: { orderBy: { order: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        });

        return rows.map((r) => this.mapToDomain(r));
    }

    private mapToDomain(row: any): Proposal {
        const milestones = (row.milestones || []).map(
            (m: any) =>
                new MilestoneQuote({
                    id: m.id,
                    proposalId: m.proposalId,
                    title: m.title,
                    description: m.description,
                    amount: Number(m.amount),
                    deliveryDays: m.deliveryDays,
                    order: m.order,
                    createdAt: m.createdAt,
                })
        );

        return new Proposal({
            id: row.id,
            projectId: row.projectId,
            freelancerId: row.freelancerId,
            coverLetter: row.coverLetter,
            totalPrice: Number(row.totalPrice),
            estimatedDays: row.estimatedDays,
            status: row.status as ProposalStatus,
            milestones,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}
