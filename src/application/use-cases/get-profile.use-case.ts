import { Profile } from '../../domain/entities/profile.entity';
import { IProfileRepository } from '../../domain/repositories/profile.repository.interface';

/**
 * Caso de Uso: Obtener Perfil.
 * Orquesta la solicitud de datos utilizando el principio de Inversión de Dependencias.
 */

export class GetProfileUseCase {
  // Inyectamos la interfaz del repositorio, no la implementación de la base de datos real.
  constructor(private profileRepository: IProfileRepository) {}

  async execute(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) throw new Error("Perfil no encontrado");
    return profile;
  }
}