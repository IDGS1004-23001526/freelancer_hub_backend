import { IProfileRepository } from '../../../domain/repositories/profile.repository.interface.js';
import { Profile } from '../../../domain/entities/profile.entity.js';

export class InMemoryProfileRepository implements IProfileRepository {
  // Este arreglo simula nuestra tabla en la base de datos
  private profiles: Profile[] = [];

  async findByUserId(userId: string): Promise<Profile | null> {
    const profile = this.profiles.find(p => p.userId === userId);
    return profile || null;
  }

  async save(profile: Profile): Promise<void> {
    const index = this.profiles.findIndex(p => p.userId === profile.userId);
    if (index >= 0) {
      // Si existe, lo actualiza (Update)
      this.profiles[index] = profile;
    } else {
      // Si no existe, lo inserta (Insert)
      this.profiles.push(profile);
    }
    
    // Solo para que veas en la consola que está funcionando cuando pruebes
    console.log("Base de datos en memoria actualizada:", JSON.stringify(this.profiles, null, 2));
  }
}