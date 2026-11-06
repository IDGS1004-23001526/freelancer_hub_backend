export enum ProposalStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED'
}

export interface MilestoneQuoteProps {
    id: string;
    proposalId: string;
    title: string;
    description?: string | null;
    amount: number;
    deliveryDays: number;
    order: number;
    createdAt: Date;
}

export class MilestoneQuote {
    constructor(private readonly props: MilestoneQuoteProps) {}

    public get id(): string { return this.props.id; }
    public get proposalId(): string { return this.props.proposalId; }
    public get title(): string { return this.props.title; }
    public get description(): string | null | undefined { return this.props.description; }
    public get amount(): number { return this.props.amount; }
    public get deliveryDays(): number { return this.props.deliveryDays; }
    public get order(): number { return this.props.order; }
    public get createdAt(): Date { return this.props.createdAt; }
}

export interface ProposalProps {
    id: string;
    projectId: string;
    freelancerId: string;
    coverLetter: string;
    totalPrice: number;
    estimatedDays: number;
    status: ProposalStatus;
    milestones: MilestoneQuote[];
    createdAt: Date;
    updatedAt: Date;
}

export class Proposal {
    constructor(private readonly props: ProposalProps) {}

    public get id(): string { return this.props.id; }
    public get projectId(): string { return this.props.projectId; }
    public get freelancerId(): string { return this.props.freelancerId; }
    public get coverLetter(): string { return this.props.coverLetter; }
    public get totalPrice(): number { return this.props.totalPrice; }
    public get estimatedDays(): number { return this.props.estimatedDays; }
    public get status(): ProposalStatus { return this.props.status; }
    public get milestones(): MilestoneQuote[] { return this.props.milestones; }
    public get createdAt(): Date { return this.props.createdAt; }
    public get updatedAt(): Date { return this.props.updatedAt; }
}
