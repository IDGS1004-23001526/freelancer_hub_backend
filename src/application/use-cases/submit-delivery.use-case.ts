import crypto from 'node:crypto';
import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import { IStorageService } from '../interfaces/storage-service.interface.js';
import {
    ContractMilestoneStatus,
    ContractStatus,
} from '../../domain/entities/contract.entity.js';
import {
    MilestoneNotFoundException,
    UnauthorizedMilestoneActionException,
    ContractNotFundedException,
    MilestoneAlreadyApprovedException,
    MilestoneAlreadySubmittedException,
} from '../../domain/exceptions/domain.exception.js';

export interface SubmitDeliveryInput {
    userId: string;
    milestoneId: string;
    notes?: string;
    repoUrl?: string;
    demoUrl?: string;
    file?: {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
        size: number;
    };
}

export class SubmitDeliveryUseCase {
    constructor(private readonly storageService: IStorageService) {}

    /**
     * Registra la entrega técnica de un hito con inmutabilidad y huella SHA-256 (HU-06).
     */
    public async execute(input: SubmitDeliveryInput) {
        const { userId, milestoneId, notes, repoUrl, demoUrl, file } = input;

        const milestone = await prisma.contractMilestone.findUnique({
            where: { id: milestoneId },
            include: { contract: true },
        });

        if (!milestone) {
            throw new MilestoneNotFoundException(milestoneId);
        }

        const contract = milestone.contract;

        // Regla: Solo el desarrollador asignado puede someter avances
        if (contract.freelancerId !== userId) {
            throw new UnauthorizedMilestoneActionException(
                'Solo el freelancer titular de este contrato puede someter entregables.'
            );
        }

        // Regla: El contrato debe estar fondeado en custodia Escrow (FUNDED o IN_PROGRESS)
        if (
            contract.status !== ContractStatus.FUNDED &&
            contract.status !== ContractStatus.IN_PROGRESS
        ) {
            throw new ContractNotFundedException();
        }

        // Regla: Impedir nuevas entregas mientras el hito esté en revisión o ya aprobado
        if (milestone.status === ContractMilestoneStatus.APPROVED) {
            throw new MilestoneAlreadyApprovedException();
        }
        if (milestone.status === ContractMilestoneStatus.SUBMITTED) {
            throw new MilestoneAlreadySubmittedException();
        }

        let sha256Hash: string;
        let deliverableUrl: string;

        if (file && file.buffer) {
            // Generación de huella criptográfica SHA-256 inmutable sobre el archivo físico
            sha256Hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
            deliverableUrl = await this.storageService.upload(file.buffer, file.originalname);
        } else {
            // Generación de huella SHA-256 sobre los artefactos y enlaces proporcionados
            const seed = `${milestone.id}_${repoUrl || ''}_${demoUrl || ''}_${notes || ''}_${Date.now()}`;
            sha256Hash = crypto.createHash('sha256').update(seed).digest('hex');
            deliverableUrl = repoUrl || demoUrl || `/deliveries/${milestone.id}`;
        }

        const now = new Date();

        const updated = await prisma.$transaction(async (tx) => {
            // Actualizar estado del hito a SUBMITTED (En Revisión)
            const updatedMilestone = await tx.contractMilestone.update({
                where: { id: milestoneId },
                data: {
                    status: ContractMilestoneStatus.SUBMITTED,
                    deliverableUrl,
                    deliverableHash: sha256Hash,
                    submittedAt: now,
                    updatedAt: now,
                },
            });

            // Si el contrato estaba solo en FUNDED, avanza automáticamente a IN_PROGRESS
            if (contract.status === ContractStatus.FUNDED) {
                await tx.contract.update({
                    where: { id: contract.id },
                    data: {
                        status: ContractStatus.IN_PROGRESS,
                        updatedAt: now,
                    },
                });
            }

            return updatedMilestone;
        });

        return {
            id: updated.id,
            contractId: updated.contractId,
            title: updated.title,
            status: updated.status,
            deliverableUrl: updated.deliverableUrl,
            deliverableHash: updated.deliverableHash,
            submittedAt: updated.submittedAt,
            notes: notes || null,
            repoUrl: repoUrl || null,
            demoUrl: demoUrl || null,
        };
    }
}
