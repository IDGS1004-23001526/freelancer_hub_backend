import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import { FreelancerProfileDto } from '../dtos/profile.dto.js';
import { IUserRepository } from '../../domain/repositories/user.repository.interface.js';
import { UserNotFoundException } from '../../domain/exceptions/domain.exception.js';

export class GetProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(userId: string): Promise<FreelancerProfileDto> {
    let profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        skills: {
          include: { skill: true },
        },
        portfolioItems: true,
      },
    });

    if (!profile) {
      // Validar si el usuario existe en el repositorio
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundException(userId);
      }

      // Asegurar que el usuario existe en la tabla de Prisma antes de enlazar su Profile
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

      const parts = user.fullName.split(' ');
      const firstName = parts[0] || 'Usuario';
      const lastName = parts.slice(1).join(' ') || '';

      profile = await prisma.profile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          bio: '',
        },
        include: {
          skills: {
            include: { skill: true },
          },
          portfolioItems: true,
        },
      });
    }

    return {
      id: profile.id,
      userId: profile.userId,
      professionalTitle: `${profile.firstName} ${profile.lastName}`.trim() || null,
      bio: profile.bio || null,
      hourlyRate: 25,
      skills: profile.skills?.map((ps) => ps.skill.name) || [],
      portfolioItems:
        profile.portfolioItems?.map((pi) => ({
          id: pi.id,
          profileId: pi.profileId,
          title: pi.title,
          description: pi.description,
          projectUrl: pi.projectUrl,
          imageUrl: pi.imageUrl,
          createdAt: pi.createdAt.toISOString(),
          updatedAt: pi.updatedAt.toISOString(),
        })) || [],
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
