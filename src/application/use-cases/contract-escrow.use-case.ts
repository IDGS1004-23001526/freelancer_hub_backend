import { randomUUID } from 'node:crypto';
import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import {
    Contract,
    ContractStatus,
    ContractMilestoneStatus,
} from '../../domain/entities/contract.entity.js';
import { WalletTransactionType } from '../../domain/entities/wallet.entity.js';
import {
    ProposalNotFoundException,
    ContractAlreadyExistsException,
    ContractNotFoundException,
    UnauthorizedContractActionException,
    InsufficientFundsException,
} from '../../domain/exceptions/domain.exception.js';

export class ContractEscrowUseCase {
    /**
     * Crea un contrato formal en estado DRAFT al aceptar una propuesta económica (HU-05).
     */
    public async createFromProposal(clientId: string, proposalId: string) {
        const proposal = await prisma.proposal.findUnique({
            where: { id: proposalId },
            include: {
                project: true,
                milestones: { orderBy: { order: 'asc' } },
                contract: true,
            },
        });

        if (!proposal) {
            throw new ProposalNotFoundException(proposalId);
        }

        if (proposal.project.clientId !== clientId) {
            throw new UnauthorizedContractActionException(
                'Solo el cliente propietario de la convocatoria puede formalizar este contrato.'
            );
        }

        if (proposal.contract) {
            throw new ContractAlreadyExistsException();
        }

        const contractId = randomUUID();
        const now = new Date();

        const created = await prisma.$transaction(async (tx) => {
            // 1. Marcar propuesta aceptada y cerrar otras propuestas pendientes
            await tx.proposal.update({
                where: { id: proposal.id },
                data: { status: 'ACCEPTED', updatedAt: now },
            });

            await tx.proposal.updateMany({
                where: {
                    projectId: proposal.projectId,
                    id: { not: proposal.id },
                    status: 'PENDING',
                },
                data: { status: 'REJECTED', updatedAt: now },
            });

            // 2. Crear el contrato en estado inicial DRAFT y clonar sus hitos
            const contract = await tx.contract.create({
                data: {
                    id: contractId,
                    projectId: proposal.projectId,
                    proposalId: proposal.id,
                    clientId,
                    freelancerId: proposal.freelancerId,
                    totalAmount: proposal.totalPrice,
                    escrowBalance: 0,
                    status: ContractStatus.DRAFT,
                    createdAt: now,
                    updatedAt: now,
                    milestones: {
                        create: proposal.milestones.map((m) => ({
                            id: randomUUID(),
                            title: m.title,
                            description: m.description,
                            amount: m.amount,
                            deliveryDays: m.deliveryDays,
                            order: m.order,
                            status: ContractMilestoneStatus.PENDING,
                        })),
                    },
                },
                include: {
                    milestones: { orderBy: { order: 'asc' } },
                },
            });

            return contract;
        });

        return this.formatContractOutput(created);
    }

    /**
     * Retiene los fondos del cliente en custodia Escrow (DRAFT -> FUNDED) de forma inmutable.
     */
    public async fundContractEscrow(clientId: string, contractId: string) {
        const contractRow = await prisma.contract.findUnique({
            where: { id: contractId },
            include: { milestones: { orderBy: { order: 'asc' } } },
        });

        if (!contractRow) {
            throw new ContractNotFoundException(contractId);
        }

        if (contractRow.clientId !== clientId) {
            throw new UnauthorizedContractActionException(
                'Solo el cliente titular puede fondear la custodia Escrow del contrato.'
            );
        }

        const domainContract = this.mapToDomain(contractRow);
        const now = new Date();

        // Validar máquina de estados estricta (DRAFT -> FUNDED)
        domainContract.transitionTo(ContractStatus.FUNDED, now);

        const requiredAmount = domainContract.totalAmount;

        const updated = await prisma.$transaction(async (tx) => {
            // Obtener o inicializar billetera del cliente
            let clientWallet = await tx.wallet.findUnique({
                where: { userId: clientId },
            });

            if (!clientWallet) {
                // Si el cliente aún no tiene wallet creada, se inicializa con saldo base para operación
                clientWallet = await tx.wallet.create({
                    data: {
                        id: randomUUID(),
                        userId: clientId,
                        availableBalance: requiredAmount,
                        escrowLocked: 0,
                        currency: 'MXN',
                    },
                });
            }

            const available = Number(clientWallet.availableBalance);
            if (available < requiredAmount) {
                throw new InsufficientFundsException(requiredAmount, available);
            }

            // Retener fondos de manera atómica: descontar de disponible y pasar a escrowLocked
            await tx.wallet.update({
                where: { id: clientWallet.id },
                data: {
                    availableBalance: available - requiredAmount,
                    escrowLocked: Number(clientWallet.escrowLocked) + requiredAmount,
                    updatedAt: now,
                },
            });

            await tx.walletTransaction.create({
                data: {
                    id: randomUUID(),
                    walletId: clientWallet.id,
                    type: WalletTransactionType.ESCROW_HOLD,
                    amount: requiredAmount,
                    feeAmount: 0,
                    netAmount: requiredAmount,
                    referenceId: contractId,
                    description: `Retención en custodia Escrow para contrato #${contractId.slice(0, 8)}`,
                    createdAt: now,
                },
            });

            // Actualizar estado del contrato a FUNDED y saldo en custodia
            return tx.contract.update({
                where: { id: contractId },
                data: {
                    status: domainContract.status,
                    escrowBalance: domainContract.escrowBalance,
                    fundedAt: domainContract.fundedAt,
                    updatedAt: now,
                },
                include: { milestones: { orderBy: { order: 'asc' } } },
            });
        });

        return this.formatContractOutput(updated);
    }

    /**
     * Avanza o actualiza el estado del contrato respetando la máquina de estados
     * y verifica que ningún freelancer marque avances si no está en FUNDED o IN_PROGRESS.
     */
    public async startOrAdvanceProgress(userId: string, contractId: string, milestoneId?: string) {
        const contractRow = await prisma.contract.findUnique({
            where: { id: contractId },
            include: { milestones: { orderBy: { order: 'asc' } } },
        });

        if (!contractRow) {
            throw new ContractNotFoundException(contractId);
        }

        if (contractRow.freelancerId !== userId && contractRow.clientId !== userId) {
            throw new UnauthorizedContractActionException();
        }

        const domainContract = this.mapToDomain(contractRow);

        // Regla crítica: Ningún freelancer puede marcar avances si no está FUNDED o IN_PROGRESS
        domainContract.assertCanRecordProgress();

        const now = new Date();
        if (domainContract.status === ContractStatus.FUNDED) {
            domainContract.transitionTo(ContractStatus.IN_PROGRESS, now);
        }

        const updated = await prisma.$transaction(async (tx) => {
            if (milestoneId) {
                await tx.contractMilestone.update({
                    where: { id: milestoneId },
                    data: {
                        status: ContractMilestoneStatus.IN_PROGRESS,
                        updatedAt: now,
                    },
                });
            }

            return tx.contract.update({
                where: { id: contractId },
                data: {
                    status: domainContract.status,
                    updatedAt: now,
                },
                include: { milestones: { orderBy: { order: 'asc' } } },
            });
        });

        return this.formatContractOutput(updated);
    }

    public async getById(contractId: string) {
        const contractRow = await prisma.contract.findUnique({
            where: { id: contractId },
            include: { milestones: { orderBy: { order: 'asc' } } },
        });

        if (!contractRow) {
            throw new ContractNotFoundException(contractId);
        }

        return this.formatContractOutput(contractRow);
    }

    public async listForUser(userId: string) {
        const rows = await prisma.contract.findMany({
            where: {
                OR: [{ clientId: userId }, { freelancerId: userId }],
            },
            include: { milestones: { orderBy: { order: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        });

        return rows.map((r) => this.formatContractOutput(r));
    }

    private mapToDomain(row: any): Contract {
        return new Contract({
            id: row.id,
            projectId: row.projectId,
            proposalId: row.proposalId,
            clientId: row.clientId,
            freelancerId: row.freelancerId,
            totalAmount: Number(row.totalAmount),
            escrowBalance: Number(row.escrowBalance),
            status: row.status as ContractStatus,
            fundedAt: row.fundedAt,
            completedAt: row.completedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            milestones: (row.milestones || []).map((m: any) => ({
                id: m.id,
                contractId: m.contractId,
                title: m.title,
                description: m.description,
                amount: Number(m.amount),
                deliveryDays: m.deliveryDays,
                order: m.order,
                status: m.status as ContractMilestoneStatus,
                deliverableUrl: m.deliverableUrl,
                deliverableHash: m.deliverableHash,
                submittedAt: m.submittedAt,
                approvedAt: m.approvedAt,
                createdAt: m.createdAt,
                updatedAt: m.updatedAt,
            })),
        });
    }

    private formatContractOutput(row: any) {
        return {
            id: row.id,
            projectId: row.projectId,
            proposalId: row.proposalId,
            clientId: row.clientId,
            freelancerId: row.freelancerId,
            totalAmount: Number(row.totalAmount),
            escrowBalance: Number(row.escrowBalance),
            status: row.status,
            fundedAt: row.fundedAt,
            completedAt: row.completedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            milestones: (row.milestones || []).map((m: any) => ({
                id: m.id,
                title: m.title,
                description: m.description,
                amount: Number(m.amount),
                deliveryDays: m.deliveryDays,
                order: m.order,
                status: m.status,
                deliverableUrl: m.deliverableUrl,
                deliverableHash: m.deliverableHash,
                submittedAt: m.submittedAt,
                approvedAt: m.approvedAt,
            })),
        };
    }
}
