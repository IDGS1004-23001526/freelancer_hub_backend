import { Request, Response, NextFunction } from 'express';
import { ContractEscrowUseCase } from '../../application/use-cases/contract-escrow.use-case.js';
import { InvalidTokenException } from '../../domain/exceptions/domain.exception.js';
import { Container } from '../../container.js';
import { ContractScopeUseCase } from '../../application/use-cases/contract-scope.use-case.js';

export class ContractController {
    constructor(private readonly contractEscrowUseCase: ContractEscrowUseCase, private readonly contractScopeUseCase: ContractScopeUseCase) { }

    public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const result = await this.contractEscrowUseCase.createFromProposal(
                claims.sub,
                req.body.proposalId
            );

            Container.logger.info('Contrato formalizado a partir de propuesta', {
                context: 'CONTRACT',
                action: 'CREATE_CONTRACT',
                statusCode: 201,
                userId: claims.sub,
                proposalId: req.body.proposalId,
                contractId: result?.id,
            });

            res.status(201).json({
                success: true,
                statusCode: 201,
                message: 'Contrato formalizado en estado DRAFT. Fondea el Escrow para iniciar.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * @ruta POST /api/v1/contracts/:id/fund
     * @descripcion Formaliza el depósito en garantía reteniendo fondos en custodia Escrow (HU-05: FLH-FE-ESCROW).
     * Soporta pago con tarjeta bancaria o saldo de billetera, y avanza el estado a IN_PROGRESS si autoStart=true.
     */
    public fund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const contractId = String(req.params.id);
            const { autoStart, paymentMethod, cardLast4 } = req.body;

            const result = await this.contractEscrowUseCase.fundContractEscrow(
                claims.sub,
                contractId,
                { autoStart: autoStart ?? true, paymentMethod, cardLast4 }
            );

            Container.logger.info('Fondos retenidos en custodia Escrow exitosamente', {
                context: 'ESCROW',
                action: 'FUND_CONTRACT',
                statusCode: 200,
                userId: claims.sub,
                contractId,
                status: result.status,
                escrowBalance: result.escrowBalance,
            });

            res.status(200).json({
                success: true,
                statusCode: 200,
                message: result.status === 'IN_PROGRESS'
                    ? 'Fondos retenidos en custodia Escrow y contrato iniciado en progreso.'
                    : 'Fondos retenidos en custodia Escrow exitosamente (Estado: FUNDED).',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    public advanceProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const contractId = String(req.params.id);
            const milestoneId = req.body.milestoneId ? String(req.body.milestoneId) : undefined;

            const result = await this.contractEscrowUseCase.startOrAdvanceProgress(
                claims.sub,
                contractId,
                milestoneId
            );

            Container.logger.info('Avance de hito / contrato procesado', {
                context: 'MILESTONE',
                action: 'ADVANCE_MILESTONE',
                statusCode: 200,
                userId: claims.sub,
                contractId,
                milestoneId,
            });

            res.status(200).json({
                success: true,
                statusCode: 200,
                message: 'Avance de contrato actualizado.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const contractId = String(req.params.id);
            const result = await this.contractEscrowUseCase.getById(
                contractId,
                req.user?.sub ?? '',
                req.user?.role
            );

            Container.logger.info('Detalle de contrato consultado', {
                context: 'CONTRACT',
                action: 'GET_CONTRACT',
                statusCode: 200,
                contractId,
                userId: req.user?.sub,
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

    public listMine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const result = await this.contractEscrowUseCase.listForUser(claims.sub);

            Container.logger.info('Listado de contratos del usuario consultado', {
                context: 'CONTRACT',
                action: 'LIST_CONTRACTS',
                statusCode: 200,
                userId: claims.sub,
                resultCount: result.length,
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

    public createChangeRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();
            const contractId = String(req.params.id);
            const result = await this.contractScopeUseCase.createChangeRequest(
                claims.sub,
                contractId,
                req.body
            );
            res.status(201).json({
                success: true,
                statusCode: 201,
                message: 'Solicitud de cambio registrada y calculada con el Triángulo de Hierro.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
    public approveChangeRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();
            const contractId = String(req.params.id);
            const changeRequestId = String(req.params.changeRequestId);
            const result = await this.contractScopeUseCase.approveChangeRequest(
                claims.sub,
                contractId,
                changeRequestId
            );
            res.status(200).json({
                success: true,
                statusCode: 200,
                message: result.awaitingCounterpartySignature
                    ? 'Firma registrada. Esperando confirmación digital de la contraparte.'
                    : 'Adenda aprobada por ambas partes. Contrato actualizado y versionado.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
    public rejectChangeRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();
            const contractId = String(req.params.id);
            const changeRequestId = String(req.params.changeRequestId);
            const result = await this.contractScopeUseCase.rejectChangeRequest(
                claims.sub,
                contractId,
                changeRequestId
            );
            res.status(200).json({
                success: true,
                statusCode: 200,
                message: 'Solicitud de cambio rechazada.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
    public getVersions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();
            const contractId = String(req.params.id);
            const result = await this.contractScopeUseCase.getContractVersions(claims.sub, contractId);
            res.status(200).json({
                success: true,
                statusCode: 200,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * @ruta POST /api/v1/contracts/:id/dispute
     * @descripcion Cliente o freelancer abre una disputa; congela entregas y liberaciones.
     */
    public openDispute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const contractId = String(req.params.id);
            const result = await this.contractEscrowUseCase.openDispute(claims.sub, contractId, req.body.reason);

            Container.logger.info('Disputa abierta sobre contrato', {
                context: 'CONTRACT',
                action: 'OPEN_DISPUTE',
                statusCode: 200,
                userId: claims.sub,
                contractId,
            });

            res.status(200).json({
                success: true,
                statusCode: 200,
                message: 'Disputa abierta. Un mediador revisará el caso.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * @ruta POST /api/v1/contracts/:id/dispute/resolve
     * @descripcion ADMIN resuelve la disputa: RESUME, REFUND o RELEASE.
     */
    public resolveDispute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const contractId = String(req.params.id);
            const result = await this.contractEscrowUseCase.resolveDispute(contractId, req.body.resolution);

            Container.logger.info('Disputa resuelta', {
                context: 'CONTRACT',
                action: 'RESOLVE_DISPUTE',
                statusCode: 200,
                userId: claims.sub,
                contractId,
                resolution: req.body.resolution,
            });

            res.status(200).json({
                success: true,
                statusCode: 200,
                message: 'Disputa resuelta.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
}
