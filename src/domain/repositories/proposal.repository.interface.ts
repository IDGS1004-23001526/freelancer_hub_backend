import { Proposal } from '../entities/proposal.entity.js';

export interface IProposalRepository {
    save(proposal: Proposal): Promise<void>;
    findById(id: string): Promise<Proposal | null>;
    findByProjectAndFreelancer(projectId: string, freelancerId: string): Promise<Proposal | null>;
    findByProjectId(projectId: string): Promise<Proposal[]>;
    findByFreelancerId(freelancerId: string): Promise<Proposal[]>;
}
