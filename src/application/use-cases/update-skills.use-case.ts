import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import { UpdateSkillsRequestDto } from '../validation/profile.schemas.js';
import { FreelancerProfileDto } from '../dtos/profile.dto.js';
import { IUserRepository } from '../../domain/repositories/user.repository.interface.js';
import { UserNotFoundException } from '../../domain/exceptions/domain.exception.js';

export class UpdateSkillsUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(
    userId: string,
    dto: UpdateSkillsRequestDto
  ): Promise<FreelancerProfileDto> {
    // 1. Validar existencia del usuario
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // 2. Asegurar que el usuario y perfil existan en PostgreSQL (Prisma)
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
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        firstName: parts[0] || 'Freelancer',
        lastName: parts.slice(1).join(' ') || '',
        bio: '',
      },
    });

    // 3. Procesar las skills enviadas: crear catálogo si no existen
    const skillEntities = await Promise.all(
      dto.skills.map(async (skillName) => {
        const cleanName = skillName.trim();
        const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return prisma.skill.upsert({
          where: { slug },
          update: { name: cleanName },
          create: {
            name: cleanName,
            slug,
            category: 'Tecnología',
          },
        });
      })
    );

    // 4. Actualizar relación en profile_skills (eliminar las anteriores y recrear)
    await prisma.$transaction(async (tx) => {
      await tx.profileSkill.deleteMany({
        where: { profileId: profile.id },
      });

      await tx.profileSkill.createMany({
        data: skillEntities.map((s) => ({
          profileId: profile.id,
          skillId: s.id,
        })),
        skipDuplicates: true,
      });
    });

    // 5. Consultar el perfil actualizado con sus skills
    const updatedProfile = await prisma.profile.findUnique({
      where: { id: profile.id },
      include: {
        skills: {
          include: { skill: true },
        },
      },
    });

    return {
      id: profile.id,
      userId: profile.userId,
      professionalTitle: `${updatedProfile?.firstName} ${updatedProfile?.lastName}`.trim() || null,
      bio: updatedProfile?.bio || null,
      hourlyRate: 25,
      skills: updatedProfile?.skills?.map((ps) => ps.skill.name) || [],
      portfolioItems: [],
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
