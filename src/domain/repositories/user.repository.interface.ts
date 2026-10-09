import { User } from '../entities/user.entity.js';
import { Email } from '../value-objects/email.vo.js';

/**
 * Contrato del Repositorio de Usuarios (Aislado de frameworks y ORMs).
 */
export interface IUserRepository {
  /**
   * Persiste un nuevo usuario en la base de datos.
   */
  save(user: User): Promise<void>;

  /**
   * Busca un usuario por su identificador único (UUID).
   */
  findById(id: string): Promise<User | null>;

  /**
   * Busca un usuario por su correo electrónico normalizado.
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Verifica la existencia de un usuario mediante su correo electrónico.
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * Actualiza el estado o información de un usuario existente.
   */
  update(user: User): Promise<void>;
}
