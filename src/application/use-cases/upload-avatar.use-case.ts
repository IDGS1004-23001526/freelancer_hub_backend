import { Avatar } from '../../domain/value-objects/avatar.vo';
import { IProfileRepository } from '../../domain/repositories/profile.repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';

/**
 * Caso de Uso: Subir Avatar.
 * Orquesta la validación del usuario, la subida del archivo al Storage y la actualización del dominio.
 */

export class UploadAvatarUseCase {
  // Se inyecta una interfaz de Storage para desacoplar si guardamos local o en AWS S3.
  constructor(
    private profileRepository: IProfileRepository,
    private storageService: IStorageService
  ) {}

  async execute(userId: string, file: Buffer, filename: string): Promise<string> {
    // 1. Validamos que el perfil exista antes de subir un archivo innecesariamente
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) throw new Error("Perfil no encontrado");

    // 2. Delegamos la subida física del archivo al servicio de infraestructura
    const avatarUrl = await this.storageService.upload(file, filename);
    
    // 3. Actualizamos la entidad de dominio con la nueva URL validada
    profile.updateAvatar(Avatar.create(avatarUrl));
    
    // 4. Persistimos los cambios en la BD
    await this.profileRepository.save(profile);
    return avatarUrl;
  }
}