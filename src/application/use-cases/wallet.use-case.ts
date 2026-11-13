import { randomUUID } from 'node:crypto';
import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import { Wallet, WalletTransactionType } from '../../domain/entities/wallet.entity.js';
import {
    InsufficientFundsException,
    InvalidClabeException,
} from '../../domain/exceptions/domain.exception.js';

export class WalletUseCase {
    /**
     * Obtiene la billetera digital del usuario con balance disponible,
     * balance retenido en Escrow e historial de transacciones.
     */
    public async getWallet(userId: string) {
        let wallet = await prisma.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
            },
        });

        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: {
                    id: randomUUID(),
                    userId,
                    availableBalance: 0,
                    escrowLocked: 0,
                    currency: 'MXN',
                },
                include: {
                    transactions: true,
                },
            });
        }

        return this.formatWallet(wallet);
    }

    /**
     * Abona fondos a la billetera digital del usuario (para fondear proyectos).
     */
    public async depositFunds(userId: string, amount: number, description?: string) {
        const now = new Date();

        const updated = await prisma.$transaction(async (tx) => {
            let wallet = await tx.wallet.findUnique({ where: { userId } });

            if (!wallet) {
                wallet = await tx.wallet.create({
                    data: {
                        id: randomUUID(),
                        userId,
                        availableBalance: 0,
                        escrowLocked: 0,
                        currency: 'MXN',
                    },
                });
            }

            const newBalance = Number(wallet.availableBalance) + amount;

            await tx.walletTransaction.create({
                data: {
                    id: randomUUID(),
                    walletId: wallet.id,
                    type: WalletTransactionType.DEPOSIT,
                    amount,
                    feeAmount: 0,
                    netAmount: amount,
                    description: description || 'Abono de fondos a billetera digital',
                    createdAt: now,
                },
            });

            return tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    availableBalance: newBalance,
                    updatedAt: now,
                },
                include: {
                    transactions: {
                        orderBy: { createdAt: 'desc' },
                        take: 50,
                    },
                },
            });
        });

        return this.formatWallet(updated);
    }

    /**
     * Acredita un pago liberado de Escrow al freelancer descontando automáticamente
     * la comisión de servicio de la plataforma (10% Service Fee).
     */
    public async creditEscrowPaymentWithServiceFee(
        freelancerId: string,
        grossAmount: number,
        referenceId?: string,
        description?: string
    ) {
        const { gross, fee, net } = Wallet.calculateServiceFee(grossAmount);
        const now = new Date();

        const updated = await prisma.$transaction(async (tx) => {
            let wallet = await tx.wallet.findUnique({ where: { userId: freelancerId } });

            if (!wallet) {
                wallet = await tx.wallet.create({
                    data: {
                        id: randomUUID(),
                        userId: freelancerId,
                        availableBalance: 0,
                        escrowLocked: 0,
                        currency: 'MXN',
                    },
                });
            }

            // Registro de crédito con desglose de comisión (10% Service Fee)
            await tx.walletTransaction.create({
                data: {
                    id: randomUUID(),
                    walletId: wallet.id,
                    type: WalletTransactionType.ESCROW_CREDIT,
                    amount: gross,
                    feeAmount: fee,
                    netAmount: net,
                    referenceId: referenceId || null,
                    description:
                        description ||
                        `Liberación de pago Escrow (Comisión plataforma 10%: -$${fee.toFixed(2)})`,
                    createdAt: now,
                },
            });

            await tx.walletTransaction.create({
                data: {
                    id: randomUUID(),
                    walletId: wallet.id,
                    type: WalletTransactionType.SERVICE_FEE,
                    amount: fee,
                    feeAmount: fee,
                    netAmount: -fee,
                    referenceId: referenceId || null,
                    description: `Comisión de plataforma (10% Service Fee)`,
                    createdAt: now,
                },
            });

            return tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    availableBalance: Number(wallet.availableBalance) + net,
                    updatedAt: now,
                },
                include: {
                    transactions: {
                        orderBy: { createdAt: 'desc' },
                        take: 50,
                    },
                },
            });
        });

        return this.formatWallet(updated);
    }

    /**
     * Procesa una orden de retiro del saldo disponible hacia una cuenta CLABE (18 dígitos).
     */
    public async withdrawToClabe(userId: string, amount: number, clabeAccount: string) {
        if (!/^\d{18}$/.test(clabeAccount)) {
            throw new InvalidClabeException();
        }

        const now = new Date();

        const updated = await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({ where: { userId } });
            const available = wallet ? Number(wallet.availableBalance) : 0;

            if (!wallet || available < amount) {
                throw new InsufficientFundsException(amount, available);
            }

            await tx.walletTransaction.create({
                data: {
                    id: randomUUID(),
                    walletId: wallet.id,
                    type: WalletTransactionType.WITHDRAWAL,
                    amount,
                    feeAmount: 0,
                    netAmount: -amount,
                    clabeAccount,
                    description: `Retiro SPEI a cuenta CLABE ••••${clabeAccount.slice(-4)}`,
                    createdAt: now,
                },
            });

            return tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    availableBalance: available - amount,
                    updatedAt: now,
                },
                include: {
                    transactions: {
                        orderBy: { createdAt: 'desc' },
                        take: 50,
                    },
                },
            });
        });

        return this.formatWallet(updated);
    }

    private formatWallet(row: any) {
        return {
            id: row.id,
            userId: row.userId,
            availableBalance: Number(row.availableBalance),
            escrowLocked: Number(row.escrowLocked),
            currency: row.currency,
            serviceFeeRate: Wallet.PLATFORM_SERVICE_FEE_RATE,
            updatedAt: row.updatedAt,
            transactions: (row.transactions || []).map((t: any) => ({
                id: t.id,
                type: t.type,
                amount: Number(t.amount),
                feeAmount: Number(t.feeAmount),
                netAmount: Number(t.netAmount),
                referenceId: t.referenceId,
                clabeAccount: t.clabeAccount,
                description: t.description,
                createdAt: t.createdAt,
            })),
        };
    }
}
