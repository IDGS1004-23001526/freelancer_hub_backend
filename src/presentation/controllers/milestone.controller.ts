import { Request, Response, NextFunction } from 'express';
import { SubmitDeliveryUseCase } from '../../application/use-cases/submit-delivery.use-case.js';
import { ApproveMilestoneUseCase } from '../../application/use-cases/approve-milestone.use-case.js';
import { InvalidTokenException } from '../../domain/exceptions/domain.exception.js';
import { Container } from '../../container.js';

export class MilestoneController {
    constructor(
        private readonly submitDeliveryUseCase: SubmitDeliveryUseCase,
        private readonly approveMilestoneUseCase: ApproveMilestoneUseCase
    ) {}

    /**
     * POST /api/v1/milestones/:id/deliveries
     * Recepción de entregables con inmutabilidad y hash criptográfico SHA-256 (HU-06).
     */
    public submitDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const milestoneId = String(req.params.id);
            const { notes, repoUrl, demoUrl } = req.body;
            const file = req.file;

            const result = await this.submitDeliveryUseCase.execute({
                userId: claims.sub,
                milestoneId,
                notes,
                repoUrl,
                demoUrl,
                file: file
                    ? {
                          buffer: file.buffer,
                          originalname: file.originalname,
                          mimetype: file.mimetype,
                          size: file.size,
                      }
                    : undefined,
            });

            Container.logger.info('Entregable técnico recibido con sello SHA-256', {
                context: 'DELIVERY',
                action: 'SUBMIT_DELIVERY',
                statusCode: 201,
                userId: claims.sub,
                milestoneId,
                sha256: result.deliverableHash,
            });

            res.status(201).json({
                success: true,
                statusCode: 201,
                message: 'Entregable técnico recibido con huella SHA-256 verificada. Hito en revisión.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /api/v1/milestones/:id/approve
     * Aprobación del cliente y liberación atómica de fondos desde custodia Escrow (HU-07).
     */
    public approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const milestoneId = String(req.params.id);

            const result = await this.approveMilestoneUseCase.execute({
                userId: claims.sub,
                milestoneId,
            });

            Container.logger.info('Hito aprobado y fondos liberados atómicamente', {
                context: 'ESCROW',
                action: 'APPROVE_MILESTONE',
                statusCode: 200,
                userId: claims.sub,
                milestoneId,
                netCredited: result.financials.netCreditedToFreelancer,
            });

            res.status(200).json({
                success: true,
                statusCode: 200,
                message: 'Hito aprobado exitosamente. Fondos transferidos a la billetera digital.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /api/v1/milestones/:id/corrections
     * Solicitud de correcciones técnicas y feedback del cliente sobre el hito.
     */
    public requestCorrections = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) throw new InvalidTokenException();

            const milestoneId = String(req.params.id);
            const feedback = req.body?.feedback || req.body?.notes;

            const result = await this.approveMilestoneUseCase.requestCorrections(
                claims.sub,
                milestoneId,
                feedback
            );

            Container.logger.info('Correcciones técnicas solicitadas sobre hito', {
                context: 'MILESTONE',
                action: 'REQUEST_CORRECTIONS',
                statusCode: 200,
                userId: claims.sub,
                milestoneId,
            });

            res.status(200).json({
                success: true,
                statusCode: 200,
                message: 'Solicitud de correcciones enviada al desarrollador.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
}
