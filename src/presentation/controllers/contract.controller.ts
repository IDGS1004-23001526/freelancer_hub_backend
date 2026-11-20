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

    public fund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const contractId = String(req.params.id);
            const result = await this.contractEscrowUseCase.fundContractEscrow(
                claims.sub,
                contractId
            );

            Container.logger.info('Fondos retenidos en custodia Escrow', {
                context: 'ESCROW',
                action: 'FUND_CONTRACT',
                statusCode: 200,
                userId: claims.sub,
                contractId,
            });

            res.status(200).json({
                success: true,
                statusCode: 200,
                message: 'Fondos retenidos en custodia Escrow exitosamente (Estado: FUNDED).',
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
            const result = await this.contractEscrowUseCase.getById(contractId);

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
}
