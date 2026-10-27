import { Profile, Skill } from '../../domain/entities/profile.entity';
import { Phone } from '../../domain/value-objects/phone.vo.js';
import { IProfileRepository } from '../../domain/repositories/profile.repository.interface';

/**
 * Caso de Uso: Actualizar Perfil (Upsert).
 * Si el perfil existe, lo actualiza. Si no existe, lo crea por primera vez.
 */

export class UpdateProfileUseCase {
  constructor(private profileRepository: IProfileRepository) {}

 async execute(userId: string, data: any): Promise<Profile> {
    // 1. Buscamos el perfil en la base de datos
    let profile = await this.profileRepository.findByUserId(userId);
    
    // 2. Instanciamos los Value Objects y Entidades a partir de los datos crudos (DTO).
    // Aquí es donde 'Telephone.create()' ejecutará sus validaciones de negocio.
    const phone = data.phone ? Phone.create(data.phone) : undefined;
    const skills = data.skills?.map((s: any) => new Skill(s.id, s.name));

    if (!profile) {
      // 3a. Flujo de Creación (Insert): Instanciamos un nuevo perfil
      profile = new Profile(userId, data.first_name, data.last_name, data.bio, phone, undefined, skills);
    } else {
      // 3b. Flujo de Actualización (Update): Usamos el método de dominio para mutar el estado 
      profile.updateDetails(data.first_name, data.last_name, data.bio, phone, skills);
    }

    // 4. Persistimos los cambios a través del repositorio
    await this.profileRepository.save(profile);
    return profile;
  }
}