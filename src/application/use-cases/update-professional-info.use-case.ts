import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import { UpdateProfessionalInfoRequestDto } from '../validation/profile.schemas.js';
import { FreelancerProfileDto } from '../dtos/profile.dto.js';
import { IUserRepository } from '../../domain/repositories/user.repository.interface.js';
import { UserNotFoundException } from '../../domain/exceptions/domain.exception.js';

export class UpdateProfessionalInfoUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(
    userId: string,
    dto: UpdateProfessionalInfoRequestDto
  ): Promise<FreelancerProfileDto> {
    // 1. Validar existencia del usuario
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // 2. Asegurar que el usuario existe en PostgreSQL (Prisma)
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email.value,
        passwordHash: user.passwordHash,
        role: user.role as any,
        isEmailVerified: user.isVerified,
        isActive: user.isActive,
      },
    });

    // 3. Dividir el título o nombre si aplica
    const parts = dto.professionalTitle.split(' ');
    const firstName = parts[0] || user.fullName.split(' ')[0] || 'Freelancer';
    const lastName = parts.slice(1).join(' ') || '';

    // 4. Actualizar o crear el perfil con bio y datos profesionales
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        firstName,
        lastName,
        bio: dto.bio || '',
      },
      create: {
        userId,
        firstName,
        lastName,
        bio: dto.bio || '',
      },
      include: {
        skills: {
          include: { skill: true },
        },
      },
    });

    return {
      id: profile.id,
      userId: profile.userId,
      professionalTitle: dto.professionalTitle,
      bio: profile.bio || null,
      hourlyRate: dto.hourlyRate || 25,
      skills: profile.skills?.map((ps) => ps.skill.name) || [],
      portfolioItems: [],
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
