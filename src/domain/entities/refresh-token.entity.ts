export interface RefreshTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

export interface CreateRefreshTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  isRevoked?: boolean;
  createdAt?: Date;
}

/**
 * Entidad que representa un token de refresco de sesión persistido de forma segura.
 */
export class RefreshToken {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _tokenHash: string;
  private readonly _expiresAt: Date;
  private _isRevoked: boolean;
  private readonly _createdAt: Date;

  constructor(props: RefreshTokenProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._tokenHash = props.tokenHash;
    this._expiresAt = props.expiresAt;
    this._isRevoked = props.isRevoked;
    this._createdAt = props.createdAt;
  }

  /**
   * Método de fábrica para instanciar un nuevo Refresh Token de dominio.
   */
  public static create(props: CreateRefreshTokenProps): RefreshToken {
    return new RefreshToken({
      id: props.id,
      userId: props.userId,
      tokenHash: props.tokenHash,
      expiresAt: props.expiresAt,
      isRevoked: props.isRevoked ?? false,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get tokenHash(): string {
    return this._tokenHash;
  }

  public get expiresAt(): Date {
    return this._expiresAt;
  }

  public get isRevoked(): boolean {
    return this._isRevoked;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Determina si el token ha superado su fecha de expiración.
   */
  public isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  /**
   * Comprueba si el token está activo y vigente (no revocado y no expirado).
   */
  public isValid(): boolean {
    return !this._isRevoked && !this.isExpired();
  }

  /**
   * Revoca explícitamente el token para impedir su reutilización.
   */
  public revoke(): void {
    this._isRevoked = true;
  }
}
