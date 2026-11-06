import { Request, Response, NextFunction } from 'express';
import { SubmitProposalUseCase } from '../../application/use-cases/submit-proposal.use-case.js';
import { InvalidTokenException } from '../../domain/exceptions/domain.exception.js';
import { IProposalRepository } from '../../domain/repositories/proposal.repository.interface.js';

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
            const projectId = String(req.params.projectId);
            const proposals = await this.proposalRepository.findByProjectId(projectId);

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
}
