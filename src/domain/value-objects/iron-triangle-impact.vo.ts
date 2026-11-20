import { InvalidScopeChangeException } from '../exceptions/domain.exception.js';

export interface DeliverableInput {
    title: string;
    description?: string;
    estimatedDays?: number;
}

export interface IronTriangleInput {
    baseTotalAmount: number;
    baseTotalDays: number;
    baseDeliverablesCount: number;
    addedDeliverables: DeliverableInput[];
    complexityFactor?: number; // 1.0 = normal, 1.25 = media, 1.5 = alta
}

export interface CalculatedDeliverable {
    title: string;
    description?: string;
    deliveryDays: number;
    amount: number;
}

/**
 * Value Object inmutable: Calcula y valida el impacto en Tiempo y Costo
 * ante una variación de Alcance usando el Triángulo de Hierro (HU-08).
 */
export class IronTriangleImpact {
    private readonly _dailyRateApplied: number;
    private readonly _suggestedAddedDays: number;
    private readonly _suggestedAddedCost: number;
    private readonly _newTotalDays: number;
    private readonly _newTotalAmount: number;
    private readonly _deliverablesBreakdown: CalculatedDeliverable[];

    private constructor(params: {
        dailyRateApplied: number;
        suggestedAddedDays: number;
        suggestedAddedCost: number;
        newTotalDays: number;
        newTotalAmount: number;
        deliverablesBreakdown: CalculatedDeliverable[];
    }) {
        this._dailyRateApplied = params.dailyRateApplied;
        this._suggestedAddedDays = params.suggestedAddedDays;
        this._suggestedAddedCost = params.suggestedAddedCost;
        this._newTotalDays = params.newTotalDays;
        this._newTotalAmount = params.newTotalAmount;
        this._deliverablesBreakdown = params.deliverablesBreakdown;
    }

    public static calculate(input: IronTriangleInput): IronTriangleImpact {
        const {
            baseTotalAmount,
            baseTotalDays,
            baseDeliverablesCount,
            addedDeliverables,
            complexityFactor = 1.0,
        } = input;

        if (!addedDeliverables || addedDeliverables.length === 0) {
            throw new InvalidScopeChangeException(
                'Debe especificar al menos un entregable nuevo para calcular la variación de alcance.'
            );
        }

        if (baseTotalAmount <= 0 || baseTotalDays <= 0 || baseDeliverablesCount <= 0) {
            throw new InvalidScopeChangeException(
                'El contrato base debe tener monto, días y entregables mayores a 0 para aplicar el Triángulo de Hierro.'
            );
        }

        if (complexityFactor < 0.5 || complexityFactor > 3.0) {
            throw new InvalidScopeChangeException(
                'El factor de complejidad debe estar entre 0.5 y 3.0.'
            );
        }

        // 1. Tasas proporcionales del contrato original
        const dailyRate = baseTotalAmount / baseTotalDays;
        const avgDaysPerDeliverable = baseTotalDays / baseDeliverablesCount;

        // 2. Desglose de cada entregable nuevo (Alcance -> Tiempo -> Costo)
        let totalAddedDays = 0;
        let totalAddedCost = 0;

        const deliverablesBreakdown: CalculatedDeliverable[] = addedDeliverables.map((item) => {
            const rawDays =
                item.estimatedDays && item.estimatedDays > 0
                    ? item.estimatedDays * complexityFactor
                    : avgDaysPerDeliverable * complexityFactor;

            // Regla anti-trabajo-gratis: mínimo 1 día adicional por entregable nuevo
            const deliveryDays = Math.max(1, Math.ceil(rawDays));
            const amount = Math.round(deliveryDays * dailyRate * 100) / 100;

            totalAddedDays += deliveryDays;
            totalAddedCost += amount;

            return {
                title: item.title.trim(),
                description: item.description?.trim(),
                deliveryDays,
                amount,
            };
        });

        const roundedDailyRate = Math.round(dailyRate * 100) / 100;
        const roundedAddedCost = Math.round(totalAddedCost * 100) / 100;

        // Doble candado: nunca permitir incremento de alcance con costo <= 0
        if (roundedAddedCost <= 0 || totalAddedDays <= 0) {
            throw new InvalidScopeChangeException(
                'El incremento de alcance requiere un ajuste proporcional positivo en tiempo y costo.'
            );
        }

        return new IronTriangleImpact({
            dailyRateApplied: roundedDailyRate,
            suggestedAddedDays: totalAddedDays,
            suggestedAddedCost: roundedAddedCost,
            newTotalDays: baseTotalDays + totalAddedDays,
            newTotalAmount: Math.round((baseTotalAmount + roundedAddedCost) * 100) / 100,
            deliverablesBreakdown,
        });
    }

    public get dailyRateApplied(): number { return this._dailyRateApplied; }
    public get suggestedAddedDays(): number { return this._suggestedAddedDays; }
    public get suggestedAddedCost(): number { return this._suggestedAddedCost; }
    public get newTotalDays(): number { return this._newTotalDays; }
    public get newTotalAmount(): number { return this._newTotalAmount; }
    public get deliverablesBreakdown(): CalculatedDeliverable[] {
        return [...this._deliverablesBreakdown];
    }

    public toJSON() {
        return {
            dailyRateApplied: this._dailyRateApplied,
            suggestedAddedDays: this._suggestedAddedDays,
            suggestedAddedCost: this._suggestedAddedCost,
            newTotalDays: this._newTotalDays,
            newTotalAmount: this._newTotalAmount,
            deliverablesBreakdown: this.deliverablesBreakdown,
        };
    }
}