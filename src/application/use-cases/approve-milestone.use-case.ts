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

        const grossAmount = Number(milestone.amount);
        const { gross, fee, net } = Wallet.calculateServiceFee(grossAmount);
        const now = new Date();

        const result = await prisma.$transaction(async (tx) => {
            // 1. Pasar estado del hito a APPROVED
            const updatedMilestone = await tx.contractMilestone.update({
                where: { id: milestone.id },
                data: {
                    status: ContractMilestoneStatus.APPROVED,
                    approvedAt: now,
                    updatedAt: now,
                },
            });

            // 2. Reducir saldo en custodia Escrow del contrato
            const currentContractEscrow = Number(contract.escrowBalance);
            const nextContractEscrow = Math.max(0, currentContractEscrow - grossAmount);

            // Verificar si todos los hitos del contrato ya están aprobados
            const remainingUnapproved = contract.milestones
                .filter((m) => m.id !== milestone.id)
                .filter((m) => m.status !== ContractMilestoneStatus.APPROVED);

            const isContractFinished = remainingUnapproved.length === 0;

            await tx.contract.update({
                where: { id: contract.id },
                data: {
                    escrowBalance: nextContractEscrow,
                    status: isContractFinished ? ContractStatus.COMPLETED : contract.status,
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

        const now = new Date();

        const updated = await prisma.contractMilestone.update({
            where: { id: milestoneId },
            data: {
                status: ContractMilestoneStatus.IN_PROGRESS,
                updatedAt: now,
            },
        });

        return {
            id: updated.id,
            contractId: updated.contractId,
            status: updated.status,
            feedback: feedback || 'Se han solicitado ajustes técnicos.',
            updatedAt: updated.updatedAt,
        };
    }
}
