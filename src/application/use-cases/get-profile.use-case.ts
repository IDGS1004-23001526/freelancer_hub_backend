import { Profile } from '../../domain/entities/profile.entity.js';
import { IProfileRepository } from '../../domain/repositories/profile.repository.interface.js';

/**
 * Caso de Uso: Obtener Perfil.
 * Orquesta la solicitud de datos utilizando el principio de Inversión de Dependencias.
 */
export class GetProfileUseCase {
  constructor(private profileRepository: IProfileRepository) {}

  async execute(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new Error('Perfil no encontrado');
    }
    return profile;
  }
}