import { Profile, Skill } from '../../domain/entities/profile.entity.js';
import { Phone } from '../../domain/value-objects/phone.vo.js';
import { IProfileRepository } from '../../domain/repositories/profile.repository.interface.js';

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
    let phone: Phone | undefined;
    if (data.phone) {
      try {
        const sanitizedPhone = typeof data.phone === 'string' ? data.phone.replace(/[^\d+]/g, '') : String(data.phone);
        phone = Phone.create(sanitizedPhone);
      } catch {
        phone = undefined;
      }
    }
    const skills = data.skills?.map((s: any) => new Skill(s.id, s.name));
    const firstName = data.firstName ?? data.first_name ?? '';
    const lastName = data.lastName ?? data.last_name ?? '';
    const hourlyRate = data.hourlyRate !== undefined && data.hourlyRate !== null ? Number(data.hourlyRate) : undefined;

    if (!profile) {
      // 3a. Flujo de Creación (Insert): Instanciamos un nuevo perfil
      profile = new Profile(
        userId,
        firstName,
        lastName,
        data.bio,
        phone,
        data.avatarUrl,
        data.professionalTitle,
        hourlyRate,
        skills ?? []
      );
    } else {
      // 3b. Flujo de Actualización (Update): Usamos el método de dominio para mutar el estado
      profile.updateDetails({
        firstName,
        lastName,
        bio: data.bio,
        phone,
        professionalTitle: data.professionalTitle,
        hourlyRate,
      });

      if (skills !== undefined) {
        profile.setSkills(skills);
      }
    }

    // 4. Persistimos los cambios a través del repositorio
    await this.profileRepository.save(profile);
    return profile;
  }
}