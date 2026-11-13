export enum WalletTransactionType {
    DEPOSIT = 'DEPOSIT',
    ESCROW_HOLD = 'ESCROW_HOLD',
    ESCROW_CREDIT = 'ESCROW_CREDIT',
    SERVICE_FEE = 'SERVICE_FEE',
    WITHDRAWAL = 'WITHDRAWAL',
}

export interface WalletTransactionProps {
    id: string;
    walletId: string;
    type: WalletTransactionType;
    amount: number;
    feeAmount: number;
    netAmount: number;
    referenceId?: string | null;
    clabeAccount?: string | null;
    description: string;
    createdAt: Date;
}

export interface WalletProps {
    id: string;
    userId: string;
    availableBalance: number;
    escrowLocked: number;
    currency: string;
    transactions: WalletTransactionProps[];
    createdAt: Date;
    updatedAt: Date;
}

export class Wallet {
    public static readonly PLATFORM_SERVICE_FEE_RATE = 0.10; // 10% comisión

    constructor(private readonly props: WalletProps) {}

    public get id(): string { return this.props.id; }
    public get userId(): string { return this.props.userId; }
    public get availableBalance(): number { return this.props.availableBalance; }
    public get escrowLocked(): number { return this.props.escrowLocked; }
    public get currency(): string { return this.props.currency; }
    public get transactions(): WalletTransactionProps[] { return this.props.transactions; }
    public get createdAt(): Date { return this.props.createdAt; }
    public get updatedAt(): Date { return this.props.updatedAt; }

    public static calculateServiceFee(grossAmount: number): {
        gross: number;
        fee: number;
        net: number;
    } {
        const fee = Math.round(grossAmount * Wallet.PLATFORM_SERVICE_FEE_RATE * 100) / 100;
        const net = Math.round((grossAmount - fee) * 100) / 100;
        return { gross: grossAmount, fee, net };
    }
}
