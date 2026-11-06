import { InvalidBudgetException } from "../exceptions/domain.exception.js";

/**
 * Value Object inmutable del presupuesto de una convocatoria
 */

export class Budget {
    private readonly _value: number;

    constructor(value: number) {
        if (typeof value != 'number' || !Number.isFinite(value) || value <= 0) {
            throw new InvalidBudgetException();
        }

        this._value = Math.round(value * 100) / 100;
    }

    public get value(): number {
        return this._value;
    }
}