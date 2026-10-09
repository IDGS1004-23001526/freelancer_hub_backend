/**
 * Clase base para todas las excepciones de la capa de Dominio.
 */
export abstract class DomainException extends Error {
  public abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Excepción lanzada cuando el formato del correo electrónico es inválido.
 */
export class InvalidEmailException extends DomainException {
  public readonly statusCode = 400;
  constructor(email: string) {
    super(`El formato del correo electrónico es inválido: "${email}".`);
  }
}

/**
 * Excepción lanzada cuando un usuario ya existe en el sistema con el mismo correo.
 */
export class UserAlreadyExistsException extends DomainException {
  public readonly statusCode = 409;
  constructor(email: string) {
    super(`El usuario con el correo "${email}" ya se encuentra registrado.`);
  }
}

/**
 * Excepción genérica de credenciales inválidas (para mitigar ataques de enumeración de usuarios).
 */
export class InvalidCredentialsException extends DomainException {
  public readonly statusCode = 401;
  constructor() {
    super('Correo electrónico o contraseña incorrectos.');
  }
}

/**
 * Excepción lanzada cuando la cuenta de un usuario está inactiva o suspendida.
 */
export class InactiveUserException extends DomainException {
  public readonly statusCode = 403;
  constructor() {
    super('La cuenta de usuario se encuentra inactiva o suspendida.');
  }
}

/**
 * Excepción lanzada cuando no se encuentra un usuario específico.
 */
export class UserNotFoundException extends DomainException {
  public readonly statusCode = 404;
  constructor(identificador: string) {
    super(`El usuario "${identificador}" no fue encontrado.`);
  }
}

/**
 * Excepción lanzada cuando un token JWT o Refresh Token es inválido o ha expirado.
 */
export class InvalidTokenException extends DomainException {
  public readonly statusCode = 401;
  constructor(mensaje = 'Token de autenticación inválido, expirado o revocado.') {
    super(mensaje);
  }
}
