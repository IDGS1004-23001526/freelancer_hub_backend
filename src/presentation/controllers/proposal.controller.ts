import { Request, Response, NextFunction } from 'express';
import { SubmitProposalUseCase } from '../../application/use-cases/submit-proposal.use-case.js';
import {
    InvalidTokenException,
    ProjectNotFoundException,
    UnauthorizedContractActionException,
} from '../../domain/exceptions/domain.exception.js';
import { IProposalRepository } from '../../domain/repositories/proposal.repository.interface.js';
import { Proposal } from '../../domain/entities/proposal.entity.js';
import { UserRole } from '../../domain/value-objects/user-role.enum.js';
import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import { Container } from '../../container.js';

export class ProposalController {
    constructor(
        private readonly submitProposalUseCase: SubmitProposalUseCase,
        private readonly proposalRepository: IProposalRepository
    ) {}

    public submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) {
                throw new InvalidTokenException();
            }

            const result = await this.submitProposalUseCase.execute(
                claims.sub,
                claims.role,
                req.body
            );

            Container.logger.info('Propuesta económica y cotización de hitos registrada', {
                context: 'PROPOSAL',
                action: 'SUBMIT_PROPOSAL',
                statusCode: 201,
                userId: claims.sub,
                proposalId: result?.id,
                projectId: req.body?.projectId,
            });

            res.status(201).json({
                success: true,
                statusCode: 201,
                message: 'Propuesta económica registrada exitosamente',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    public getMine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) {
                throw new InvalidTokenException();
            }

            const proposals = await this.proposalRepository.findByFreelancerId(claims.sub);

            Container.logger.info('Postulaciones propias del freelancer consultadas', {
                context: 'PROPOSAL',
                action: 'GET_MY_PROPOSALS',
                statusCode: 200,
                userId: claims.sub,
                resultCount: proposals.length,
            });

            res.status(200).json({
                success: true,
                statusCode: 200,
                data: proposals.map(this.mapProposalToResponse),
            });
        } catch (error) {
            next(error);
        }
    };

    public getByProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) {
                throw new InvalidTokenException();
            }

            const projectId = String(req.params.projectId);
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(projectId)) {
                throw new ProjectNotFoundException(projectId);
            }

            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { id: true, clientId: true },
            });

            if (!project) {
                throw new ProjectNotFoundException(projectId);
            }

            if (claims.role !== UserRole.ADMIN && project.clientId !== claims.sub) {
                throw new UnauthorizedContractActionException(
                    'Solo el cliente dueño de la convocatoria puede consultar sus propuestas.'
                );
            }

            const proposals = await this.proposalRepository.findByProjectId(projectId);

            Container.logger.info('Propuestas del proyecto consultadas', {
                context: 'PROPOSAL',
                action: 'GET_PROPOSALS',
                statusCode: 200,
                projectId,
                resultCount: proposals.length,
            });

            res.status(200).json({
                success: true,
                statusCode: 200,
                data: proposals.map(this.mapProposalToResponse),
            });
        } catch (error) {
            next(error);
        }
    };

    private mapProposalToResponse = (p: Proposal) => ({
        id: p.id,
        projectId: p.projectId,
        freelancerId: p.freelancerId,
        coverLetter: p.coverLetter,
        totalPrice: p.totalPrice,
        estimatedDays: p.estimatedDays,
        status: p.status,
        createdAt: p.createdAt,
        milestones: p.milestones.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            amount: m.amount,
            deliveryDays: m.deliveryDays,
            order: m.order,
        })),
    });
}
