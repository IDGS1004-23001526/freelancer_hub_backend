import { randomUUID } from 'node:crypto';
import { IProposalRepository } from '../../domain/repositories/proposal.repository.interface.js';
import { Proposal, MilestoneQuote, ProposalStatus } from '../../domain/entities/proposal.entity.js';
import { CreateProposalDto } from '../validation/proposal.schemas.js';
import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import {
    ProjectNotFoundException,
    ProposalAlreadySubmittedException,
    ProposalExceedsProjectBudgetException,
    ProposalMilestonesMismatchException,
    FreelancerRoleRequiredException,
    ProjectNotActiveException,
} from '../../domain/exceptions/domain.exception.js';
import { UserRole } from '../../domain/value-objects/user-role.enum.js';

export interface ProposalOutputDto {
    id: string;
    projectId: string;
    freelancerId: string;
    coverLetter: string;
    totalPrice: number;
    estimatedDays: number;
    status: string;
    createdAt: string;
    milestones: {
        id: string;
        title: string;
        description?: string | null;
        amount: number;
        deliveryDays: number;
        order: number;
    }[];
}

export class SubmitProposalUseCase {
    constructor(private readonly proposalRepository: IProposalRepository) {}

    public async execute(
        freelancerId: string,
        userRole: string,
        dto: CreateProposalDto
    ): Promise<ProposalOutputDto> {
        // Regla: Rol FREELANCER
        if (userRole !== UserRole.FREELANCER) {
            throw new FreelancerRoleRequiredException();
        }

        // 1. Validar existencia y estado del proyecto
        const project = await prisma.project.findUnique({
            where: { id: dto.projectId },
        });

        if (!project) {
            throw new ProjectNotFoundException(dto.projectId);
        }

        if (project.status !== 'ACTIVE') {
            throw new ProjectNotActiveException();
        }

        // 2. Regla 1: Validar que el monto total ofertado no exceda el presupuesto máximo
        const maxBudget = Number(project.budget);
        if (dto.totalPrice > maxBudget) {
            throw new ProposalExceedsProjectBudgetException(dto.totalPrice, maxBudget);
        }

        // 3. Validar consistencia de los hitos vs totalPrice
        const sumMilestones = dto.milestones.reduce((acc, m) => acc + m.amount, 0);
        if (Math.abs(sumMilestones - dto.totalPrice) > 0.01) {
            throw new ProposalMilestonesMismatchException();
        }

        // 4. Regla 2 (Anti-abuso): Restringir a máximo 1 propuesta activa por freelancer
        const existing = await this.proposalRepository.findByProjectAndFreelancer(
            dto.projectId,
            freelancerId
        );

        if (existing) {
            throw new ProposalAlreadySubmittedException();
        }

        // 5. Construcción de entidad de dominio
        const proposalId = randomUUID();
        const now = new Date();

        const milestoneEntities = dto.milestones.map((m, index) => {
            return new MilestoneQuote({
                id: randomUUID(),
                proposalId,
                title: m.title,
                description: m.description,
                amount: m.amount,
                deliveryDays: m.deliveryDays,
                order: m.order ?? index + 1,
                createdAt: now,
            });
        });

        const proposal = new Proposal({
            id: proposalId,
            projectId: dto.projectId,
            freelancerId,
            coverLetter: dto.coverLetter,
            totalPrice: dto.totalPrice,
            estimatedDays: dto.estimatedDays,
            status: ProposalStatus.PENDING,
            milestones: milestoneEntities,
            createdAt: now,
            updatedAt: now,
        });

        // 6. Guardado transaccional en repositorio
        await this.proposalRepository.save(proposal);

        return {
            id: proposal.id,
            projectId: proposal.projectId,
            freelancerId: proposal.freelancerId,
            coverLetter: proposal.coverLetter,
            totalPrice: proposal.totalPrice,
            estimatedDays: proposal.estimatedDays,
            status: proposal.status,
            createdAt: proposal.createdAt.toISOString(),
            milestones: proposal.milestones.map((m) => ({
                id: m.id,
                title: m.title,
                description: m.description,
                amount: m.amount,
                deliveryDays: m.deliveryDays,
                order: m.order,
            })),
        };
    }
}
