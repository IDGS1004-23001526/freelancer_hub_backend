import { InvalidEmailException } from '../exceptions/domain.exception.js';

/**
 * Value Object inmutable para la gestión, validación y normalización del correo electrónico.
 */
export class Email {
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private readonly _value: string;

  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw new InvalidEmailException(value || '');
    }

    const normalizado = value.trim().toLowerCase();
    if (!Email.EMAIL_REGEX.test(normalizado)) {
      throw new InvalidEmailException(normalizado);
    }

    this._value = normalizado;
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: Email): boolean {
    return this._value === other.value;
  }

  public toString(): string {
    return this._value;
  }
}
