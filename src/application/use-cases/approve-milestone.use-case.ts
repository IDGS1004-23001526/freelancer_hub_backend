import { randomUUID } from 'node:crypto';
import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import { Wallet, WalletTransactionType } from '../../domain/entities/wallet.entity.js';
import {
    ContractMilestoneStatus,
    ContractStatus,
} from '../../domain/entities/contract.entity.js';
import {
    MilestoneNotFoundException,
    UnauthorizedMilestoneActionException,
    MilestoneAlreadyApprovedException,
    ContractNotFundedException,
    InvalidStateActionException,
} from '../../domain/exceptions/domain.exception.js';

export interface ApproveMilestoneInput {
    userId: string;
    milestoneId: string;
}

export class ApproveMilestoneUseCase {
    /**
     * Aprueba la entrega de un hito y ejecuta la liberación atómica de fondos
     * desde custodia Escrow a la billetera digital del desarrollador con descuento de comisión (HU-07).
     */
    public async execute(input: ApproveMilestoneInput) {
        const { userId, milestoneId } = input;

        const milestone = await prisma.contractMilestone.findUnique({
            where: { id: milestoneId },
            include: {
                contract: {
                    include: {
                        milestones: { orderBy: { order: 'asc' } },
                    },
                },
            },
        });

        if (!milestone) {
            throw new MilestoneNotFoundException(milestoneId);
        }

        const contract = milestone.contract;

        // Regla: Solo el cliente propietario de la convocatoria puede autorizar y liberar el dinero
        if (contract.clientId !== userId) {
            throw new UnauthorizedMilestoneActionException(
                'Solo el cliente contratante puede autorizar la aprobación del hito y la liberación de pagos.'
            );
        }

        // Regla: Evitar doble liberación si ya fue aprobado
        if (milestone.status === ContractMilestoneStatus.APPROVED) {
            throw new MilestoneAlreadyApprovedException();
        }

        if (
            contract.status !== ContractStatus.FUNDED &&
            contract.status !== ContractStatus.IN_PROGRESS
        ) {
            throw new ContractNotFundedException();
        }

        if (milestone.status !== ContractMilestoneStatus.SUBMITTED) {
            throw new InvalidStateActionException(
                'Solo se puede aprobar un hito con entregable enviado (SUBMITTED).'
            );
        }

        const grossAmount = Number(milestone.amount);
        const { gross, fee, net } = Wallet.calculateServiceFee(grossAmount);
        const now = new Date();

        const result = await prisma.$transaction(async (tx) => {
            // 1. Pasar estado del hito a APPROVED
            // Actualización condicional: evita doble liberación de pago por requests concurrentes.
            const claimed = await tx.contractMilestone.updateMany({
                where: { id: milestone.id, status: ContractMilestoneStatus.SUBMITTED },
                data: {
                    status: ContractMilestoneStatus.APPROVED,
                    approvedAt: now,
                    updatedAt: now,
                },
            });
            if (claimed.count === 0) {
                throw new MilestoneAlreadyApprovedException();
            }
            const updatedMilestone = await tx.contractMilestone.findUniqueOrThrow({
                where: { id: milestone.id },
            });

            const freshContract = await tx.contract.findUniqueOrThrow({
                where: { id: contract.id },
                include: { milestones: true },
            });
            if (Number(freshContract.escrowBalance) < grossAmount) {
                throw new InvalidStateActionException(
                    'El saldo en custodia del contrato no cubre el monto del hito.'
                );
            }

            // 2. Reducir saldo en custodia Escrow del contrato
            const currentContractEscrow = Number(freshContract.escrowBalance);
            const nextContractEscrow = Math.max(0, currentContractEscrow - grossAmount);

            // Verificar si todos los hitos del contrato ya están aprobados
            const remainingUnapproved = freshContract.milestones
                .filter((m) => m.id !== milestone.id)
                .filter((m) => m.status !== ContractMilestoneStatus.APPROVED);

            const isContractFinished = remainingUnapproved.length === 0;

            await tx.contract.update({
                where: { id: contract.id },
                data: {
                    escrowBalance: nextContractEscrow,
                    status: isContractFinished ? ContractStatus.COMPLETED : ContractStatus.IN_PROGRESS,
                    completedAt: isContractFinished ? now : contract.completedAt,
                    updatedAt: now,
                },
            });

            // 3. Actualizar billetera del cliente (descontar de escrowLocked)
            const clientWallet = await tx.wallet.findUnique({
                where: { userId: contract.clientId },
            });

            if (clientWallet) {
                const currentLocked = Number(clientWallet.escrowLocked);
                await tx.wallet.update({
                    where: { id: clientWallet.id },
                    data: {
                        escrowLocked: Math.max(0, currentLocked - grossAmount),
                        updatedAt: now,
                    },
                });
            }

            // 4. Acreditar a la billetera del freelancer descontando la comisión del 10%
            let freelancerWallet = await tx.wallet.findUnique({
                where: { userId: contract.freelancerId },
            });

            if (!freelancerWallet) {
                freelancerWallet = await tx.wallet.create({
                    data: {
                        id: randomUUID(),
                        userId: contract.freelancerId,
                        availableBalance: 0,
                        escrowLocked: 0,
                        currency: 'MXN',
                    },
                });
            }

            // Registro contable de crédito Escrow
            await tx.walletTransaction.create({
                data: {
                    id: randomUUID(),
                    walletId: freelancerWallet.id,
                    type: WalletTransactionType.ESCROW_CREDIT,
                    amount: gross,
                    feeAmount: fee,
                    netAmount: net,
                    referenceId: milestone.id,
                    description: `Liberación de pago por hito #${milestone.order}: "${milestone.title}" (Comisión 10%: -$${fee.toFixed(2)})`,
                    createdAt: now,
                },
            });

            // Registro contable de la comisión de servicio
            await tx.walletTransaction.create({
                data: {
                    id: randomUUID(),
                    walletId: freelancerWallet.id,
                    type: WalletTransactionType.SERVICE_FEE,
                    amount: fee,
                    feeAmount: fee,
                    netAmount: -fee,
                    referenceId: milestone.id,
                    description: `Comisión de plataforma (10% Service Fee) - Hito #${milestone.order}`,
                    createdAt: now,
                },
            });

            // Actualizar balance disponible del desarrollador
            await tx.wallet.update({
                where: { id: freelancerWallet.id },
                data: {
                    availableBalance: Number(freelancerWallet.availableBalance) + net,
                    updatedAt: now,
                },
            });

            return {
                milestone: updatedMilestone,
                isContractFinished,
                grossAmount: gross,
                serviceFee: fee,
                netCredited: net,
                remainingContractEscrow: nextContractEscrow,
            };
        });

        return {
            success: true,
            milestoneId: result.milestone.id,
            contractId: contract.id,
            status: result.milestone.status,
            order: result.milestone.order,
            title: result.milestone.title,
            approvedAt: result.milestone.approvedAt,
            financials: {
                grossAmount: result.grossAmount,
                serviceFeeDeducted: result.serviceFee,
                netCreditedToFreelancer: result.netCredited,
                remainingEscrowBalance: result.remainingContractEscrow,
            },
            isContractFinished: result.isContractFinished,
        };
    }

    /**
     * Regresa un hito a revisión / estado de correcciones técnicas a petición del cliente.
     */
    public async requestCorrections(userId: string, milestoneId: string, feedback?: string) {
        const milestone = await prisma.contractMilestone.findUnique({
            where: { id: milestoneId },
            include: { contract: true },
        });

        if (!milestone) {
            throw new MilestoneNotFoundException(milestoneId);
        }

        if (milestone.contract.clientId !== userId) {
            throw new UnauthorizedMilestoneActionException(
                'Solo el cliente del contrato puede solicitar correcciones sobre el entregable.'
            );
        }

        if (milestone.status !== ContractMilestoneStatus.SUBMITTED) {
            throw new InvalidStateActionException(
                'Solo se pueden solicitar correcciones sobre un entregable enviado (SUBMITTED).'
            );
        }

        const feedbackText = feedback?.trim() || 'Se han solicitado ajustes técnicos.';

        const now = new Date();

        const updated = await prisma.contractMilestone.update({
            where: { id: milestoneId },
            data: {
                status: ContractMilestoneStatus.IN_PROGRESS,
                correctionFeedback: feedbackText,
                updatedAt: now,
            },
        });

        return {
            id: updated.id,
            contractId: updated.contractId,
            status: updated.status,
            feedback: feedbackText,
            updatedAt: updated.updatedAt,
        };
    }
}
