import { Email } from '../value-objects/email.vo.js';
import { UserRole } from '../value-objects/user-role.enum.js';

export interface UserProps {
  id: string;
  email: Email;
  fullName: string;
  passwordHash: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  id: string;
  email: Email;
  fullName: string;
  passwordHash: string;
  role: UserRole;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entidad principal de Usuario en el dominio FreelancerHub.
 */
export class User {
  private readonly _id: string;
  private _email: Email;
  private _fullName: string;
  private _passwordHash: string;
  private _role: UserRole;
  private _isVerified: boolean;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: UserProps) {
    this._id = props.id;
    this._email = props.email;
    this._fullName = props.fullName;
    this._passwordHash = props.passwordHash;
    this._role = props.role;
    this._isVerified = props.isVerified;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * Método de fábrica para instanciar un nuevo usuario de dominio con valores por defecto.
   */
  public static create(props: CreateUserProps): User {
    const ahora = new Date();
    return new User({
      id: props.id,
      email: props.email,
      fullName: props.fullName.trim(),
      passwordHash: props.passwordHash,
      role: props.role,
      isVerified: props.isVerified ?? false,
      isActive: props.isActive ?? true,
      createdAt: props.createdAt ?? ahora,
      updatedAt: props.updatedAt ?? ahora,
    });
  }

  public get id(): string {
    return this._id;
  }

  public get email(): Email {
    return this._email;
  }

  public get fullName(): string {
    return this._fullName;
  }

  public get passwordHash(): string {
    return this._passwordHash;
  }

  public get role(): UserRole {
    return this._role;
  }

  public get isVerified(): boolean {
    return this._isVerified;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Cambia la contraseña cifrada del usuario y actualiza la marca de tiempo.
   */
  public changePassword(newPasswordHash: string): void {
    this._passwordHash = newPasswordHash;
    this._updatedAt = new Date();
  }

  /**
   * Marca la cuenta de usuario como verificada.
   */
  public verifyEmail(): void {
    this._isVerified = true;
    this._updatedAt = new Date();
  }

  /**
   * Suspende o desactiva la cuenta del usuario.
   */
  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Reactiva la cuenta del usuario.
   */
  public activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Actualiza el nombre completo del usuario.
   */
  public updateFullName(fullName: string): void {
    this._fullName = fullName.trim();
    this._updatedAt = new Date();
  }
}
