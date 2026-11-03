import { Profile } from '../entities/profile.entity.js';

/**
 * Contrato del Repositorio de Perfiles (Desacoplado de la persistencia física).
 */
export interface IProfileRepository {
  /**
   * Busca el perfil de un usuario por su identificador único (userId).
   */
  findByUserId(userId: string): Promise<Profile | null>;

  /**
   * Guarda o actualiza (Upsert) el perfil en el mecanismo de persistencia.
   */
  save(profile: Profile): Promise<void>;

  /**
   * Elimina un perfil por el ID de usuario (opcional).
   */
  deleteByUserId?(userId: string): Promise<void>;
}
