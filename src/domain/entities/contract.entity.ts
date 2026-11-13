import {
    InvalidContractTransitionException,
    ContractNotFundedException,
} from '../exceptions/domain.exception.js';

export enum ContractStatus {
    DRAFT = 'DRAFT',
    FUNDED = 'FUNDED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    DISPUTED = 'DISPUTED',
}

export enum ContractMilestoneStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    SUBMITTED = 'SUBMITTED',
    APPROVED = 'APPROVED',
}

const VALID_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
    [ContractStatus.DRAFT]: [ContractStatus.FUNDED],
    [ContractStatus.FUNDED]: [ContractStatus.IN_PROGRESS, ContractStatus.DISPUTED],
    [ContractStatus.IN_PROGRESS]: [ContractStatus.COMPLETED, ContractStatus.DISPUTED],
    [ContractStatus.DISPUTED]: [ContractStatus.IN_PROGRESS, ContractStatus.COMPLETED],
    [ContractStatus.COMPLETED]: [],
};

export interface ContractMilestoneProps {
    id: string;
    contractId: string;
    title: string;
    description?: string | null;
    amount: number;
    deliveryDays: number;
    order: number;
    status: ContractMilestoneStatus;
    deliverableUrl?: string | null;
    deliverableHash?: string | null;
    submittedAt?: Date | null;
    approvedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ContractProps {
    id: string;
    projectId: string;
    proposalId: string;
    clientId: string;
    freelancerId: string;
    totalAmount: number;
    escrowBalance: number;
    status: ContractStatus;
    fundedAt?: Date | null;
    completedAt?: Date | null;
    milestones: ContractMilestoneProps[];
    createdAt: Date;
    updatedAt: Date;
}

export class Contract {
    private _props: ContractProps;

    constructor(props: ContractProps) {
        this._props = { ...props };
    }

    public get id(): string { return this._props.id; }
    public get projectId(): string { return this._props.projectId; }
    public get proposalId(): string { return this._props.proposalId; }
    public get clientId(): string { return this._props.clientId; }
    public get freelancerId(): string { return this._props.freelancerId; }
    public get totalAmount(): number { return this._props.totalAmount; }
    public get escrowBalance(): number { return this._props.escrowBalance; }
    public get status(): ContractStatus { return this._props.status; }
    public get fundedAt(): Date | null | undefined { return this._props.fundedAt; }
    public get completedAt(): Date | null | undefined { return this._props.completedAt; }
    public get milestones(): ContractMilestoneProps[] { return this._props.milestones; }
    public get createdAt(): Date { return this._props.createdAt; }
    public get updatedAt(): Date { return this._props.updatedAt; }

    public transitionTo(nextStatus: ContractStatus, now: Date = new Date()): void {
        const allowed = VALID_TRANSITIONS[this._props.status] || [];
        if (!allowed.includes(nextStatus)) {
            throw new InvalidContractTransitionException(this._props.status, nextStatus);
        }

        this._props.status = nextStatus;
        this._props.updatedAt = now;

        if (nextStatus === ContractStatus.FUNDED) {
            this._props.escrowBalance = this._props.totalAmount;
            this._props.fundedAt = now;
        } else if (nextStatus === ContractStatus.COMPLETED) {
            this._props.completedAt = now;
        }
    }

    /**
     * Regla de custodia Escrow: Ningún freelancer puede marcar avances si el contrato
     * no está en estado FUNDED o IN_PROGRESS.
     */
    public assertCanRecordProgress(): void {
        if (
            this._props.status !== ContractStatus.FUNDED &&
            this._props.status !== ContractStatus.IN_PROGRESS
        ) {
            throw new ContractNotFundedException();
        }
    }
}
