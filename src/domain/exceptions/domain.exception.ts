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

/**
export class ResourceNotFoundException extends DomainException {
  public readonly statusCode = 404;
  constructor(mensaje = 'El recurso solicitado no fue encontrado.') {
    super(mensaje);
  }
}

/**
 * MODULE ======> PROJECTS
 */
export class InvalidProjectTitleException extends DomainException {
  public readonly statusCode = 400;
  constructor(min = 10) {
    super(`El título de la convocatoria debe tener al menos ${min} caracteres.`);
  }
}

export class InvalidProjectDescriptionException extends DomainException {
  public readonly statusCode = 400;
  constructor(min = 30) {
    super(`La descripción de la convocatoria debe tener al menos ${min} caracteres.`);
  }
}

export class InvalidBudgetException extends DomainException {
  public readonly statusCode = 400;
  constructor() {
    super('El presupuesto debe ser estrictamente mayor que 0');
  }
}

export class InsufficientSkillTagsException extends DomainException {
  public readonly statusCode = 400;
  constructor(min = 3) {
    super(`La convocatoria requiere al menos ${min} tags de habilidades distintos.`);
  }
}

export class InvalidEstimatedDateException extends DomainException {
  public readonly statusCode = 400;
  constructor() {
    super('La fecha estimada debe ser posterior a la fecha actual.');
  }
}

export class ProjectCreationNotAllowedException extends DomainException {
  public readonly statusCode = 403;
  constructor() {
    super('Solo los usuarios con rol CLIENT pueden publicar convocatorias.');
  }
}

/**
 * MODULE ======> PROPOSALS & MILESTONES (HU-03 / HU-04)
 */
export class ProjectNotFoundException extends DomainException {
  public readonly statusCode = 404;
  constructor(projectId: string) {
    super(`La convocatoria con id "${projectId}" no existe o ya no está disponible.`);
  }
}

export class ProposalAlreadySubmittedException extends DomainException {
  public readonly statusCode = 409;
  constructor() {
    super('Ya has postulado una propuesta para esta convocatoria. No se permiten propuestas duplicadas.');
  }
}

export class ProposalExceedsProjectBudgetException extends DomainException {
  public readonly statusCode = 400;
  constructor(totalPrice: number, maxBudget: number) {
    super(`El monto total de la propuesta ($${totalPrice.toFixed(2)}) excede el presupuesto máximo del proyecto ($${maxBudget.toFixed(2)}).`);
  }
}

export class ProposalMilestonesMismatchException extends DomainException {
  public readonly statusCode = 400;
  constructor() {
    super('La suma del monto de los hitos debe ser igual al precio total de la propuesta.');
  }
}

export class FreelancerRoleRequiredException extends DomainException {
  public readonly statusCode = 403;
  constructor() {
    super('Solo los usuarios con rol FREELANCER pueden postular propuestas a proyectos.');
  }
}

export class ProjectNotActiveException extends DomainException {
  public readonly statusCode = 400;
  constructor() {
    super('No se pueden enviar propuestas a una convocatoria que no se encuentra activa.');
  }
}

/**
 * MODULE ======> CONTRACTS & ESCROW (FLH-ESCROW-01 / HU-05)
 */
export class ContractNotFoundException extends DomainException {
  public readonly statusCode = 404;
  constructor(contractId: string) {
    super(`El contrato con id "${contractId}" no existe.`);
  }
}

export class ProposalNotFoundException extends DomainException {
  public readonly statusCode = 404;
  constructor(proposalId: string) {
    super(`La propuesta con id "${proposalId}" no existe.`);
  }
}

export class InvalidContractTransitionException extends DomainException {
  public readonly statusCode = 400;
  constructor(from: string, to: string) {
    super(`Transición de contrato no permitida: de "${from}" a "${to}".`);
  }
}

export class ContractNotFundedException extends DomainException {
  public readonly statusCode = 403;
  constructor() {
    super('El contrato debe contar con fondos retenidos en custodia Escrow (FUNDED o IN_PROGRESS) antes de registrar avances.');
  }
}

export class UnauthorizedContractActionException extends DomainException {
  public readonly statusCode = 403;
  constructor(mensaje = 'No tienes autorización para realizar esta operación sobre el contrato.') {
    super(mensaje);
  }
}

export class ContractAlreadyExistsException extends DomainException {
  public readonly statusCode = 409;
  constructor() {
    super('Esta propuesta ya cuenta con un contrato formalizado.');
  }
}

/**
 * MODULE ======> WALLET & FINANCES (FLH-WALLET-01 / HU-14)
 */
export class InsufficientFundsException extends DomainException {
  public readonly statusCode = 400;
  constructor(required: number, available: number) {
    super(`Saldo disponible insuficiente ($${available.toFixed(2)}). Se requieren $${required.toFixed(2)}.`);
  }
}

export class InvalidClabeException extends DomainException {
  public readonly statusCode = 400;
  constructor() {
    super('La cuenta CLABE interbancaria debe contener exactamente 18 dígitos numéricos.');
  }
}

/**
 * MODULE ======> SCOPE & IRON TRIANGLE 
 */
export class ChangeRequestNotFoundException extends DomainException {
  public readonly statusCode = 404;
  constructor(changeRequestId: string) {
    super(`La solicitud de cambio (adenda) con id "${changeRequestId}" no existe.`);
  }
}

export class ChangeRequestAlreadyResolvedException extends DomainException {
  public readonly statusCode = 409;
  constructor(status: string) {
    super(`La solicitud de cambio ya fue resuelta con estado "${status}" y no puede modificarse.`);
  }
}

export class InvalidScopeChangeException extends DomainException {
  public readonly statusCode = 400;
  constructor(mensaje: string) {
    super(mensaje);
  }
}

/**
 * MODULE ======> MILESTONES & DELIVERIES (FLH-BE-DELIVERY / FLH-BE-RELEASE)
 */
export class MilestoneNotFoundException extends DomainException {
  public readonly statusCode = 404;
  constructor(milestoneId: string) {
    super(`El hito con id "${milestoneId}" no fue encontrado.`);
  }
}

export class UnauthorizedMilestoneActionException extends DomainException {
  public readonly statusCode = 403;
  constructor(mensaje = 'No tienes permisos para realizar esta acción sobre el hito.') {
    super(mensaje);
  }
}

export class MilestoneAlreadyApprovedException extends DomainException {
  public readonly statusCode = 409;
  constructor() {
    super('Este hito ya fue aprobado previamente y sus fondos ya han sido liberados.');
  }
}

/**
 * MODULE ======> PAYMENT METHODS (FREEL-31 / PAY-01)
 */
export class PaymentMethodNotFoundException extends DomainException {
  public readonly statusCode = 404;
  constructor(id: string) {
    super(`El método de pago con id "${id}" no fue encontrado.`);
  }
}

export class PaymentMethodForbiddenException extends DomainException {
  public readonly statusCode = 403;
  constructor() {
    super('No tienes permisos para operar sobre este método de pago.');
  }
}
