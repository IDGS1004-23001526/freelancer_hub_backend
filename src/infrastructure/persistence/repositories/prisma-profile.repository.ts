import { PrismaClient } from '@prisma/client';
import { IProfileRepository } from '../../../domain/repositories/profile.repository.interface.js';
import { Profile, PortfolioItem } from '../../../domain/entities/profile.entity.js';
import { Phone } from '../../../domain/value-objects/phone.vo.js';

/**
 * Implementación concreta del repositorio de perfiles utilizando Prisma ORM y PostgreSQL.
 */
export class PrismaProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<Profile | null> {
    const raw = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        portfolioItems: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!raw) {
      return null;
    }

    let phone: Phone | undefined;
    if (raw.phone) {
      try {
        phone = Phone.create(raw.phone);
      } catch {
        // En caso de formato previo no estricto, permitimos continuar
        phone = undefined;
      }
    }

    const portfolio = raw.portfolioItems.map(
      (item) =>
        new PortfolioItem(
          item.id,
          item.title,
          item.description,
          item.projectUrl,
          item.imageUrl
        )
    );

    const skills = raw.skills.map((ps) => ({
      id: ps.skill.id,
      name: ps.skill.name,
    }));

    return new Profile(
      raw.userId,
      raw.firstName,
      raw.lastName,
      raw.bio ?? undefined,
      phone ?? raw.phone ?? undefined,
      raw.avatarUrl ?? undefined,
      raw.professionalTitle ?? undefined,
      raw.hourlyRate ?? undefined,
      skills,
      portfolio
    );
  }

  async save(profile: Profile): Promise<void> {
    const phoneStr =
      typeof profile.phone === 'string'
        ? profile.phone
        : profile.phone?.value ?? null;

    const saved = await this.prisma.profile.upsert({
      where: { userId: profile.userId },
      create: {
        userId: profile.userId,
        firstName: profile.firstName || 'Usuario',
        lastName: profile.lastName || '',
        bio: profile.bio ?? null,
        phone: phoneStr,
        avatarUrl: profile.avatarUrl ?? null,
        professionalTitle: profile.professionalTitle ?? null,
        hourlyRate: profile.hourlyRate ?? null,
      },
      update: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio ?? null,
        phone: phoneStr,
        avatarUrl: profile.avatarUrl ?? null,
        professionalTitle: profile.professionalTitle ?? null,
        hourlyRate: profile.hourlyRate ?? null,
      },
    });

    // Sincronizar Portfolio Items con PostgreSQL
    if (profile.portfolioItems) {
      const currentItemIds = profile.portfolioItems.map((item) => item.id);

      // Eliminar los ítems removidos del agregado
      await this.prisma.portfolioItem.deleteMany({
        where: {
          profileId: saved.id,
          id: { notIn: currentItemIds },
        },
      });

      // Upsert de los ítems actuales
      for (const item of profile.portfolioItems) {
        await this.prisma.portfolioItem.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            profileId: saved.id,
            title: item.title,
            description: item.description,
            projectUrl: item.projectUrl,
            imageUrl: item.imageUrl,
          },
          update: {
            title: item.title,
            description: item.description,
            projectUrl: item.projectUrl,
            imageUrl: item.imageUrl,
          },
        });
      }
    }

    // Sincronizar Skills con PostgreSQL (tabla skills y profile_skills)
    if (profile.skills && Array.isArray(profile.skills)) {
      // Eliminar vinculaciones anteriores
      await this.prisma.profileSkill.deleteMany({
        where: { profileId: saved.id },
      });

      for (const s of profile.skills) {
        const skillName = typeof s === 'string' ? s : s?.name;
        if (!skillName || typeof skillName !== 'string') continue;

        const skillSlug = skillName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Garantizar que la habilidad exista en el catálogo 'skills'
        const skillRecord = await this.prisma.skill.upsert({
          where: { slug: skillSlug },
          update: { name: skillName.trim() },
          create: {
            name: skillName.trim(),
            slug: skillSlug,
            category: (typeof s === 'object' && s?.category) || 'Tecnología',
          },
        });

        // Crear la relación en la tabla intermedia 'profile_skills'
        await this.prisma.profileSkill.create({
          data: {
            profileId: saved.id,
            skillId: skillRecord.id,
          },
        });
      }
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.profile.deleteMany({
      where: { userId },
    });
  }
}
