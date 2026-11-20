import { randomUUID, createHash } from 'node:crypto';
import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import {
    IronTriangleImpact,
    CalculatedDeliverable,
} from '../../domain/value-objects/iron-triangle-impact.vo.js';
import { ContractStatus, ContractMilestoneStatus } from '../../domain/entities/contract.entity.js';
import {
    ContractNotFoundException,
    UnauthorizedContractActionException,
    ChangeRequestNotFoundException,
    ChangeRequestAlreadyResolvedException,
    InvalidScopeChangeException,
} from '../../domain/exceptions/domain.exception.js';
import { CreateChangeRequestDto } from '../validation/scope-change.schemas.js';

export class ContractScopeUseCase {
    /**
     * Registra una solicitud de cambio de alcance y calcula automáticamente su impacto
     * en días y tarifa proporcional mediante el Triángulo de Hierro.
     */
    public async createChangeRequest(
        userId: string,
        contractId: string,
        dto: CreateChangeRequestDto
    ) {
        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                milestones: { orderBy: { order: 'asc' } },
                versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
            },
        });

        if (!contract) {
            throw new ContractNotFoundException(contractId);
        }

        if (contract.clientId !== userId && contract.freelancerId !== userId) {
            throw new UnauthorizedContractActionException(
                'Solo las partes del contrato pueden solicitar cambios de alcance.'
            );
        }

        if (contract.status === ContractStatus.COMPLETED || contract.status === ContractStatus.DISPUTED) {
            throw new InvalidScopeChangeException(
                `No se pueden solicitar cambios de alcance en un contrato en estado ${contract.status}.`
            );
        }

        const baseTotalAmount = Number(contract.totalAmount);
        const baseTotalDays = contract.milestones.reduce((acc, m) => acc + m.deliveryDays, 0);
        const baseDeliverablesCount = contract.milestones.length;

        // Ejecutar Value Object del Triángulo de Hierro
        const impact = IronTriangleImpact.calculate({
            baseTotalAmount,
            baseTotalDays,
            baseDeliverablesCount,
            addedDeliverables: dto.addedDeliverables,
            complexityFactor: dto.complexityFactor,
        });

        const now = new Date();
        const isClient = userId === contract.clientId;
        const signatureHash = this.generateDigitalSignature(contractId, userId, now);

        const changeRequest = await prisma.$transaction(async (tx) => {
            // Si aún no existe versión base en la bitácora inmutable, registrar Versión 1
            if (contract.versions.length === 0) {
                await tx.contractVersion.create({
                    data: {
                        id: randomUUID(),
                        contractId: contract.id,
                        versionNumber: 1,
                        changeRequestId: null,
                        createdById: contract.clientId,
                        reason: 'Versión inicial del contrato base',
                        totalAmount: baseTotalAmount,
                        totalDays: baseTotalDays,
                        snapshot: {
                            contractId: contract.id,
                            status: contract.status,
                            totalAmount: baseTotalAmount,
                            totalDays: baseTotalDays,
                            milestones: contract.milestones.map((m) => ({
                                id: m.id,
                                title: m.title,
                                amount: Number(m.amount),
                                deliveryDays: m.deliveryDays,
                                order: m.order,
                                status: m.status,
                            })),
                        },
                        createdAt: contract.createdAt,
                    },
                });
            }

            // Crear la adenda (queda firmada por quien la solicita; falta la firma de la contraparte)
            return tx.contractChangeRequest.create({
                data: {
                    id: randomUUID(),
                    contractId: contract.id,
                    requestedById: userId,
                    title: dto.title,
                    description: dto.description,
                    baseAmountSnapshot: baseTotalAmount,
                    baseDaysSnapshot: baseTotalDays,
                    addedDeliverables: impact.deliverablesBreakdown as unknown as object,
                    complexityFactor: dto.complexityFactor ?? 1.0,
                    suggestedAddedDays: impact.suggestedAddedDays,
                    suggestedAddedCost: impact.suggestedAddedCost,
                    dailyRateApplied: impact.dailyRateApplied,
                    clientApproved: isClient,
                    clientSignedAt: isClient ? now : null,
                    clientSignature: isClient ? signatureHash : null,
                    freelancerApproved: !isClient,
                    freelancerSignedAt: !isClient ? now : null,
                    freelancerSignature: !isClient ? signatureHash : null,
                    status: 'PENDING',
                    createdAt: now,
                    updatedAt: now,
                },
            });
        });

        return {
            changeRequest: this.formatChangeRequest(changeRequest),
            ironTriangleCalculation: impact.toJSON(),
        };
    }

    /**
     * Registra la firma/confirmación digital de una de las partes.
     * Solo cuando AMBAS partes aprueban, actualiza el contrato base y crea una nueva versión inmutable.
     */
    public async approveChangeRequest(
        userId: string,
        contractId: string,
        changeRequestId: string
    ) {
        const changeRequest = await prisma.contractChangeRequest.findUnique({
            where: { id: changeRequestId },
            include: {
                contract: {
                    include: {
                        milestones: { orderBy: { order: 'asc' } },
                        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
                    },
                },
            },
        });

        if (!changeRequest || changeRequest.contractId !== contractId) {
            throw new ChangeRequestNotFoundException(changeRequestId);
        }

        const { contract } = changeRequest;
        if (contract.clientId !== userId && contract.freelancerId !== userId) {
            throw new UnauthorizedContractActionException(
                'No tienes autorización para aprobar adendas de este contrato.'
            );
        }

        if (changeRequest.status !== 'PENDING') {
            throw new ChangeRequestAlreadyResolvedException(changeRequest.status);
        }

        const now = new Date();
        const isClient = userId === contract.clientId;
        const signatureHash = this.generateDigitalSignature(changeRequestId, userId, now);

        const nextClientApproved = isClient ? true : changeRequest.clientApproved;
        const nextFreelancerApproved = !isClient ? true : changeRequest.freelancerApproved;
        const bothApproved = nextClientApproved && nextFreelancerApproved;

        const result = await prisma.$transaction(async (tx) => {
            const updatedCr = await tx.contractChangeRequest.update({
                where: { id: changeRequestId },
                data: {
                    clientApproved: nextClientApproved,
                    clientSignedAt: isClient ? now : changeRequest.clientSignedAt,
                    clientSignature: isClient ? signatureHash : changeRequest.clientSignature,
                    freelancerApproved: nextFreelancerApproved,
                    freelancerSignedAt: !isClient ? now : changeRequest.freelancerSignedAt,
                    freelancerSignature: !isClient ? signatureHash : changeRequest.freelancerSignature,
                    status: bothApproved ? 'APPROVED' : 'PENDING',
                    resolvedAt: bothApproved ? now : null,
                    updatedAt: now,
                },
            });

            if (!bothApproved) {
                return { changeRequest: updatedCr, updatedContract: null, newVersion: null };
            }

            // Ambas partes firmaron -> Actualizar contrato base y registrar versión inmutable
            const deliverables = changeRequest.addedDeliverables as unknown as CalculatedDeliverable[];
            const currentMaxOrder = contract.milestones.reduce((max, m) => Math.max(max, m.order), 0);
            const newTotalAmount = Number(contract.totalAmount) + Number(changeRequest.suggestedAddedCost);

            const updatedContract = await tx.contract.update({
                where: { id: contract.id },
                data: {
                    totalAmount: newTotalAmount,
                    updatedAt: now,
                    milestones: {
                        create: deliverables.map((d, idx) => ({
                            id: randomUUID(),
                            title: d.title,
                            description: d.description ?? null,
                            amount: d.amount,
                            deliveryDays: d.deliveryDays,
                            order: currentMaxOrder + idx + 1,
                            status: ContractMilestoneStatus.PENDING,
                        })),
                    },
                },
                include: { milestones: { orderBy: { order: 'asc' } } },
            });

            const lastVersionNumber = contract.versions[0]?.versionNumber ?? 1;
            const totalDays = updatedContract.milestones.reduce((acc, m) => acc + m.deliveryDays, 0);

            const newVersion = await tx.contractVersion.create({
                data: {
                    id: randomUUID(),
                    contractId: contract.id,
                    versionNumber: lastVersionNumber + 1,
                    changeRequestId: changeRequest.id,
                    createdById: userId,
                    reason: `Adenda aprobada por ambas partes: ${changeRequest.title}`,
                    totalAmount: newTotalAmount,
                    totalDays,
                    snapshot: {
                        contractId: updatedContract.id,
                        status: updatedContract.status,
                        totalAmount: newTotalAmount,
                        totalDays,
                        addedCost: Number(changeRequest.suggestedAddedCost),
                        addedDays: changeRequest.suggestedAddedDays,
                        clientSignature: updatedCr.clientSignature,
                        freelancerSignature: updatedCr.freelancerSignature,
                        milestones: updatedContract.milestones.map((m) => ({
                            id: m.id,
                            title: m.title,
                            amount: Number(m.amount),
                            deliveryDays: m.deliveryDays,
                            order: m.order,
                            status: m.status,
                        })),
                    },
                    createdAt: now,
                },
            });

            return { changeRequest: updatedCr, updatedContract, newVersion };
        });

        return {
            status: result.changeRequest.status,
            awaitingCounterpartySignature: result.changeRequest.status === 'PENDING',
            changeRequest: this.formatChangeRequest(result.changeRequest),
            newVersionNumber: result.newVersion?.versionNumber ?? null,
        };
    }

    /**
     * Rechaza una solicitud de cambio pendiente.
     */
    public async rejectChangeRequest(userId: string, contractId: string, changeRequestId: string) {
        const changeRequest = await prisma.contractChangeRequest.findUnique({
            where: { id: changeRequestId },
            include: { contract: true },
        });

        if (!changeRequest || changeRequest.contractId !== contractId) {
            throw new ChangeRequestNotFoundException(changeRequestId);
        }

        if (changeRequest.contract.clientId !== userId && changeRequest.contract.freelancerId !== userId) {
            throw new UnauthorizedContractActionException();
        }

        if (changeRequest.status !== 'PENDING') {
            throw new ChangeRequestAlreadyResolvedException(changeRequest.status);
        }

        const updated = await prisma.contractChangeRequest.update({
            where: { id: changeRequestId },
            data: { status: 'REJECTED', resolvedAt: new Date() },
        });

        return this.formatChangeRequest(updated);
    }

    /**
     * Consulta la bitácora inmutable de versiones de un contrato.
     */
    public async getContractVersions(userId: string, contractId: string) {
        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
        });

        if (!contract) {
            throw new ContractNotFoundException(contractId);
        }

        if (contract.clientId !== userId && contract.freelancerId !== userId) {
            throw new UnauthorizedContractActionException();
        }

        const versions = await prisma.contractVersion.findMany({
            where: { contractId },
            orderBy: { versionNumber: 'asc' },
        });

        return versions.map((v) => ({
            ...v,
            totalAmount: Number(v.totalAmount),
        }));
    }

    private generateDigitalSignature(entityId: string, userId: string, timestamp: Date): string {
        return createHash('sha256')
            .update(`${entityId}:${userId}:${timestamp.toISOString()}`)
            .digest('hex');
    }

    private formatChangeRequest(row: any) {
        return {
            ...row,
            baseAmountSnapshot: Number(row.baseAmountSnapshot),
            suggestedAddedCost: Number(row.suggestedAddedCost),
            dailyRateApplied: Number(row.dailyRateApplied),
        };
    }
}