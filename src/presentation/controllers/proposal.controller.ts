import { Request, Response, NextFunction } from 'express';
import { SubmitProposalUseCase } from '../../application/use-cases/submit-proposal.use-case.js';
import {
    InvalidTokenException,
    ProjectNotFoundException,
    ProposalNotFoundException,
    UnauthorizedContractActionException,
    InvalidStateActionException,
} from '../../domain/exceptions/domain.exception.js';
import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import { IProposalRepository } from '../../domain/repositories/proposal.repository.interface.js';
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

    public getByProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) {
                throw new InvalidTokenException();
            }

            const projectId = String(req.params.projectId);
            const project = await prisma.project.findUnique({ where: { id: projectId }, select: { clientId: true } });
            if (!project) {
                throw new ProjectNotFoundException(projectId);
            }
            if (claims.role !== 'ADMIN' && project.clientId !== claims.sub) {
                throw new UnauthorizedContractActionException('Solo el cliente dueño de la convocatoria puede ver sus propuestas.');
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
                data: proposals.map((p) => ({
                    id: p.id,
                    projectId: p.projectId,
                    freelancerId: p.freelancerId,
                    freelancerName: (p as any).freelancerName,
                    freelancerRole: (p as any).freelancerRole,
                    freelancer: (p as any).freelancer,
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
                })),
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

            res.status(200).json({
                success: true,
                statusCode: 200,
                data: proposals.map((p) => ({
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
                })),
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * @ruta POST /api/v1/proposals/:id/reject
     * @descripcion El cliente dueño de la convocatoria declina una propuesta PENDING.
     */
    public reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) {
                throw new InvalidTokenException();
            }

            const proposalId = String(req.params.id);
            const proposal = await prisma.proposal.findUnique({
                where: { id: proposalId },
                include: { project: { select: { clientId: true } } },
            });
            if (!proposal) {
                throw new ProposalNotFoundException(proposalId);
            }
            if (proposal.project.clientId !== claims.sub) {
                throw new UnauthorizedContractActionException('Solo el cliente dueño de la convocatoria puede rechazar propuestas.');
            }

            const result = await prisma.proposal.updateMany({
                where: { id: proposalId, status: 'PENDING' },
                data: { status: 'REJECTED' },
            });
            if (result.count === 0) {
                throw new InvalidStateActionException('Solo se pueden rechazar propuestas en estado PENDING.');
            }

            Container.logger.info('Propuesta rechazada por el cliente', {
                context: 'PROPOSAL',
                action: 'REJECT_PROPOSAL',
                statusCode: 200,
                userId: claims.sub,
                proposalId,
            });

            res.status(200).json({
                success: true,
                statusCode: 200,
                message: 'Propuesta rechazada.',
                data: { id: proposalId, status: 'REJECTED' },
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * @ruta POST /api/v1/proposals/:id/withdraw
     * @descripcion El freelancer retira su propia propuesta mientras siga PENDING.
     */
    public withdraw = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = req.user;
            if (!claims) {
                throw new InvalidTokenException();
            }

            const proposalId = String(req.params.id);
            const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
            if (!proposal) {
                throw new ProposalNotFoundException(proposalId);
            }
            if (proposal.freelancerId !== claims.sub) {
                throw new UnauthorizedContractActionException('Solo el autor puede retirar la propuesta.');
            }

            const result = await prisma.proposal.updateMany({
                where: { id: proposalId, status: 'PENDING' },
                data: { status: 'WITHDRAWN' },
            });
            if (result.count === 0) {
                throw new InvalidStateActionException('Solo se pueden retirar propuestas en estado PENDING.');
            }

            Container.logger.info('Propuesta retirada por el freelancer', {
                context: 'PROPOSAL',
                action: 'WITHDRAW_PROPOSAL',
                statusCode: 200,
                userId: claims.sub,
                proposalId,
            });

            res.status(200).json({
                success: true,
                statusCode: 200,
                message: 'Propuesta retirada.',
                data: { id: proposalId, status: 'WITHDRAWN' },
            });
        } catch (error) {
            next(error);
        }
    };
}
