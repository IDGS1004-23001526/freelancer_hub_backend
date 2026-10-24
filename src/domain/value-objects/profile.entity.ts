import { Phone } from '../value-objects/phone.vo.js';
import { Avatar } from '../value-objects/avatar.vo';

// Entidad anémica simple para representar una habilidad.
export class Skill {
  constructor(public readonly id: string, public readonly name: string) {}
}

/**
 * Entidad 'Profile' (Perfil). 
 * Actúa como la raíz del agregado (Aggregate Root) para la gestión del perfil del usuario.
 * Controla sus propios datos y mutaciones (Modelo de Dominio Rico).
 */

export class Profile {
  constructor(
    public readonly userId: string,
    public firstName: string,
    public lastName: string,
    public bio?: string,
    public phone?: Phone,
    public avatarUrl?: Avatar,
    public skills: Skill[] = []
  ) {}

  // Método específico del dominio para actualizar el avatar.
  // Evitamos exponer la propiedad directamente (setters públicos) para proteger el estado.
  public updateAvatar(newAvatar: Avatar): void {
    this.avatarUrl = newAvatar;
  }

  // Método unificado para actualizar la información general del perfil.
  // Solo actualiza las propiedades si se reciben nuevos valores.
  public updateDetails(firstName: string, lastName: string, bio?: string, phone?: Phone, skills?: Skill[]): void {
    this.firstName = firstName;
    this.lastName = lastName;
    if (bio !== undefined) this.bio = bio;
    if (phone !== undefined) this.phone = phone;
    if (skills !== undefined) this.skills = skills;
  }
}