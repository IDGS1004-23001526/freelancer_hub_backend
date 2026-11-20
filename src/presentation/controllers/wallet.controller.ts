import { Request, Response, NextFunction } from 'express';
import { WalletUseCase } from '../../application/use-cases/wallet.use-case.js';
import { InvalidTokenException } from '../../domain/exceptions/domain.exception.js';
import { Container } from '../../container.js';

export class WalletController {
    constructor(private readonly walletUseCase: WalletUseCase) {}

    public getWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const result = await this.walletUseCase.getWallet(claims.sub);

            Container.logger.info('Balance e historial de billetera digital consultado', {
                context: 'WALLET',
                action: 'GET_WALLET',
                statusCode: 200,
                userId: claims.sub,
                availableBalance: result?.availableBalance,
                escrowLocked: result?.escrowLocked,
            });

            res.status(200).json({
                success: true,
                statusCode: 200,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    public deposit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const result = await this.walletUseCase.depositFunds(
                claims.sub,
                req.body.amount,
                req.body.description
            );

            Container.logger.info('Abono acreditado a billetera digital', {
                context: 'WALLET',
                action: 'DEPOSIT_FUNDS',
                statusCode: 200,
                userId: claims.sub,
                amount: req.body.amount,
            });

            res.status(200).json({
                success: true,
                statusCode: 200,
                message: 'Abono acreditado exitosamente a la billetera.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    public withdraw = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const result = await this.walletUseCase.withdrawToClabe(
                claims.sub,
                req.body.amount,
                req.body.clabeAccount
            );

            Container.logger.info('Retiro de fondos procesado', {
                context: 'WALLET',
                action: 'WITHDRAW_FUNDS',
                statusCode: 200,
                userId: claims.sub,
                amount: req.body.amount,
            });

            res.status(200).json({
                success: true,
                statusCode: 200,
                message: 'Orden de retiro SPEI a cuenta CLABE procesada exitosamente.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    public creditEscrow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const result = await this.walletUseCase.creditEscrowPaymentWithServiceFee(
                req.body.freelancerId,
                req.body.grossAmount,
                req.body.contractId,
                req.body.description
            );

            Container.logger.info('Pago Escrow liberado y acreditado con retención de comisión (10%)', {
                context: 'WALLET',
                action: 'CREDIT_ESCROW_FEE',
                statusCode: 200,
                userId: claims.sub,
                freelancerId: req.body.freelancerId,
                contractId: req.body.contractId,
                grossAmount: req.body.grossAmount,
                updatedAvailableBalance: result?.availableBalance,
            });

            res.status(200).json({
                success: true,
                statusCode: 200,
                message: 'Pago acreditado aplicando 10% de comisión de plataforma (Service Fee).',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
}
