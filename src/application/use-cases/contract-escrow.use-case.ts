import { randomUUID } from 'node:crypto';
import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import {
    Contract,
    ContractStatus,
    ContractMilestoneStatus,
} from '../../domain/entities/contract.entity.js';
import { Wallet, WalletTransactionType } from '../../domain/entities/wallet.entity.js';
import {
    ProposalNotFoundException,
    ContractAlreadyExistsException,
    ContractNotFoundException,
    UnauthorizedContractActionException,
    InsufficientFundsException,
    InvalidStateActionException,
    MilestoneNotFoundException,
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

        if (proposal.status !== 'PENDING') {
            throw new InvalidStateActionException(
                'Solo se pueden formalizar propuestas en estado PENDING.'
            );
        }

        if (proposal.project.status !== 'ACTIVE') {
            throw new InvalidStateActionException(
                'La convocatoria ya está cerrada y no admite nuevos contratos.'
            );
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

            // La convocatoria se cierra al formalizar el contrato para no recibir más propuestas.
            await tx.project.update({
                where: { id: proposal.projectId },
                data: { status: 'CLOSED', updatedAt: now },
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
     * Retiene los fondos del cliente en custodia Escrow (HU-05: FLH-FE-ESCROW).
     * Valida la máquina de estados (DRAFT -> FUNDED) y opcionalmente avanza de inmediato a IN_PROGRESS (autoStart).
     * Si el cliente paga con tarjeta bancaria, abona automáticamente la diferencia para una experiencia de checkout fluida.
     */
    public async fundContractEscrow(
        clientId: string,
        contractId: string,
        options?: {
            autoStart?: boolean;
            paymentMethod?: string;
            cardLast4?: string;
        }
    ) {
        const contractRow = await prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                milestones: { orderBy: { order: 'asc' } },
                project: true,
                freelancer: { include: { profile: true } },
                client: { include: { profile: true } },
            },
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
                // Si el cliente aún no tiene wallet creada, se inicializa con saldo para la operación
                clientWallet = await tx.wallet.create({
                    data: {
                        id: randomUUID(),
                        userId: clientId,
                        availableBalance: 0,
                        escrowLocked: 0,
                        currency: 'MXN',
                    },
                });
            }

            let available = Number(clientWallet.availableBalance);

            // Soporte de pago con tarjeta o abono automático si el saldo disponible es menor
            if (available < requiredAmount) {
                if (options?.paymentMethod === 'wallet' || !options?.cardLast4) {
                    throw new InsufficientFundsException(requiredAmount, available);
                }

                const deficit = requiredAmount - available;
                const cardLabel = options?.cardLast4 ? `•••• ${options.cardLast4}` : 'tarjeta bancaria';

                await tx.walletTransaction.create({
                    data: {
                        id: randomUUID(),
                        walletId: clientWallet.id,
                        type: WalletTransactionType.DEPOSIT,
                        amount: deficit,
                        feeAmount: 0,
                        netAmount: deficit,
                        referenceId: contractId,
                        description: `Abono inmediato para custodia Escrow con ${cardLabel}`,
                        createdAt: now,
                    },
                });

                available = requiredAmount;
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

            // Si autoStart es true (requerimiento HU-05), pasar de FUNDED a IN_PROGRESS
            let targetStatus = domainContract.status;
            if (options?.autoStart !== false) {
                domainContract.transitionTo(ContractStatus.IN_PROGRESS, now);
                targetStatus = domainContract.status;
            }

            // Actualizar estado del contrato a FUNDED / IN_PROGRESS y saldo en custodia
            return tx.contract.update({
                where: { id: contractId },
                data: {
                    status: targetStatus,
                    escrowBalance: domainContract.escrowBalance,
                    fundedAt: domainContract.fundedAt,
                    updatedAt: now,
                },
                include: {
                    milestones: { orderBy: { order: 'asc' } },
                    project: true,
                    freelancer: { include: { profile: true } },
                    client: { include: { profile: true } },
                },
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

        if (contractRow.freelancerId !== userId) {
            throw new UnauthorizedContractActionException(
                'Solo el freelancer del contrato puede registrar avances.'
            );
        }

        if (milestoneId) {
            const target = contractRow.milestones.find((m) => m.id === milestoneId);
            if (!target) {
                throw new MilestoneNotFoundException(milestoneId);
            }
            if (target.status !== ContractMilestoneStatus.PENDING) {
                throw new InvalidStateActionException(
                    'Solo un hito en estado PENDING puede pasar a IN_PROGRESS.'
                );
            }
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

    /**
     * Obtiene el detalle legal de un contrato enriquecido con datos del proyecto y perfiles.
     */
    public async getById(contractId: string, userId: string, role?: string) {
        const contractRow = await prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                milestones: { orderBy: { order: 'asc' } },
                project: true,
                freelancer: { include: { profile: true } },
                client: { include: { profile: true } },
            },
        });

        if (!contractRow) {
            throw new ContractNotFoundException(contractId);
        }

        if (role !== 'ADMIN' && contractRow.clientId !== userId && contractRow.freelancerId !== userId) {
            throw new UnauthorizedContractActionException('No participas en este contrato.');
        }

        return this.formatContractOutput(contractRow);
    }

    /**
     * Abre una disputa sobre un contrato en curso. Bloquea entregas y aprobaciones
     * hasta que un administrador la resuelva.
     */
    public async openDispute(userId: string, contractId: string, reason: string) {
        const contractRow = await prisma.contract.findUnique({
            where: { id: contractId },
            include: { milestones: { orderBy: { order: 'asc' } } },
        });

        if (!contractRow) {
            throw new ContractNotFoundException(contractId);
        }

        if (contractRow.clientId !== userId && contractRow.freelancerId !== userId) {
            throw new UnauthorizedContractActionException('No participas en este contrato.');
        }

        const domainContract = this.mapToDomain(contractRow);
        const now = new Date();
        domainContract.transitionTo(ContractStatus.DISPUTED, now);

        const updated = await prisma.contract.update({
            where: { id: contractId },
            data: {
                status: ContractStatus.DISPUTED,
                disputeReason: reason,
                disputeOpenedById: userId,
                disputeOpenedAt: now,
                updatedAt: now,
            },
            include: { milestones: { orderBy: { order: 'asc' } } },
        });

        return this.formatContractOutput(updated);
    }

    /**
     * Resuelve una disputa (solo ADMIN):
     * - RESUME: el contrato vuelve a IN_PROGRESS.
     * - REFUND: el saldo en custodia regresa al cliente y el contrato se cierra.
     * - RELEASE: el saldo en custodia se paga al freelancer (con comisión) y el contrato se cierra.
     */
    public async resolveDispute(contractId: string, resolution: 'RESUME' | 'REFUND' | 'RELEASE') {
        const contractRow = await prisma.contract.findUnique({
            where: { id: contractId },
            include: { milestones: { orderBy: { order: 'asc' } } },
        });

        if (!contractRow) {
            throw new ContractNotFoundException(contractId);
        }

        const domainContract = this.mapToDomain(contractRow);
        const now = new Date();
        const nextStatus = resolution === 'RESUME' ? ContractStatus.IN_PROGRESS : ContractStatus.COMPLETED;
        domainContract.transitionTo(nextStatus, now);

        const escrow = Number(contractRow.escrowBalance);

        const updated = await prisma.$transaction(async (tx) => {
            // Bloqueo optimista: solo procede si el contrato sigue en disputa.
            const guard = await tx.contract.updateMany({
                where: { id: contractId, status: ContractStatus.DISPUTED },
                data: { updatedAt: now },
            });
            if (guard.count === 0) {
                throw new InvalidStateActionException('El contrato ya no está en disputa.');
            }

            if (resolution !== 'RESUME' && escrow > 0) {
                const clientWallet = await tx.wallet.findUnique({ where: { userId: contractRow.clientId } });
                if (clientWallet) {
                    await tx.wallet.update({
                        where: { id: clientWallet.id },
                        data: {
                            escrowLocked: Math.max(0, Number(clientWallet.escrowLocked) - escrow),
                            availableBalance:
                                resolution === 'REFUND'
                                    ? Number(clientWallet.availableBalance) + escrow
                                    : Number(clientWallet.availableBalance),
                            updatedAt: now,
                        },
                    });
                    if (resolution === 'REFUND') {
                        await tx.walletTransaction.create({
                            data: {
                                id: randomUUID(),
                                walletId: clientWallet.id,
                                type: WalletTransactionType.DEPOSIT,
                                amount: escrow,
                                feeAmount: 0,
                                netAmount: escrow,
                                referenceId: contractId,
                                description: `Reembolso de custodia Escrow por disputa #${contractId.slice(0, 8)}`,
                                createdAt: now,
                            },
                        });
                    }
                }

                if (resolution === 'RELEASE') {
                    const { fee, net } = Wallet.calculateServiceFee(escrow);
                    let freelancerWallet = await tx.wallet.findUnique({ where: { userId: contractRow.freelancerId } });
                    if (!freelancerWallet) {
                        freelancerWallet = await tx.wallet.create({
                            data: {
                                id: randomUUID(),
                                userId: contractRow.freelancerId,
                                availableBalance: 0,
                                escrowLocked: 0,
                                currency: 'MXN',
                            },
                        });
                    }
                    await tx.walletTransaction.create({
                        data: {
                            id: randomUUID(),
                            walletId: freelancerWallet.id,
                            type: WalletTransactionType.ESCROW_CREDIT,
                            amount: escrow,
                            feeAmount: fee,
                            netAmount: net,
                            referenceId: contractId,
                            description: `Liberación de custodia por resolución de disputa #${contractId.slice(0, 8)}`,
                            createdAt: now,
                        },
                    });
                    await tx.wallet.update({
                        where: { id: freelancerWallet.id },
                        data: {
                            availableBalance: Number(freelancerWallet.availableBalance) + net,
                            updatedAt: now,
                        },
                    });
                }
            }

            return tx.contract.update({
                where: { id: contractId },
                data: {
                    status: nextStatus,
                    escrowBalance: resolution === 'RESUME' ? contractRow.escrowBalance : 0,
                    completedAt: nextStatus === ContractStatus.COMPLETED ? now : contractRow.completedAt,
                    disputeResolution: resolution,
                    disputeResolvedAt: now,
                    updatedAt: now,
                },
                include: { milestones: { orderBy: { order: 'asc' } } },
            });
        });

        return this.formatContractOutput(updated);
    }

    /**
     * Lista los contratos asociados a un usuario con información completa de contrapartes.
     */
    public async listForUser(userId: string) {
        const rows = await prisma.contract.findMany({
            where: {
                OR: [{ clientId: userId }, { freelancerId: userId }],
            },
            include: {
                milestones: { orderBy: { order: 'asc' } },
                project: true,
                freelancer: { include: { profile: true } },
                client: { include: { profile: true } },
            },
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
        const freelancerProfile = row.freelancer?.profile;
        const clientProfile = row.client?.profile;

        const freelancerName = freelancerProfile
            ? `${freelancerProfile.firstName} ${freelancerProfile.lastName}`.trim()
            : (row.freelancer?.email ? row.freelancer.email.split('@')[0] : 'Mateo Villalobos');

        const clientName = clientProfile
            ? `${clientProfile.firstName} ${clientProfile.lastName}`.trim()
            : (row.client?.email ? row.client.email.split('@')[0] : 'Sofía Ramírez');

        return {
            id: row.id,
            projectId: row.projectId,
            projectTitle: row.project?.title || `Contrato #${row.id.slice(0, 8)}`,
            projectCategory: row.project?.category || 'Desarrollo Web',
            projectDescription: row.project?.description,
            proposalId: row.proposalId,
            clientId: row.clientId,
            clientName,
            freelancerId: row.freelancerId,
            freelancerName,
            freelancerRole: freelancerProfile?.professionalTitle || 'Arquitecto Full-Stack & Especialista Fintech',
            freelancerAvatar: freelancerProfile?.avatarUrl,
            totalAmount: Number(row.totalAmount),
            escrowBalance: Number(row.escrowBalance),
            status: row.status,
            fundedAt: row.fundedAt,
            completedAt: row.completedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            milestones: (row.milestones || []).map((m: any) => ({
                id: m.id,
                contractId: m.contractId || row.id,
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
