import { Request, Response, NextFunction } from 'express';
import { WalletUseCase } from '../../application/use-cases/wallet.use-case.js';
import { InvalidTokenException } from '../../domain/exceptions/domain.exception.js';

export class WalletController {
    constructor(private readonly walletUseCase: WalletUseCase) {}

    public getWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const result = await this.walletUseCase.getWallet(claims.sub);

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
