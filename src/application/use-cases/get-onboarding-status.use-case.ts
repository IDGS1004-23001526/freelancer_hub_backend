import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import { OnboardingProgressDto } from '../dtos/profile.dto.js';

export class GetOnboardingStatusUseCase {
  public async execute(userId: string): Promise<OnboardingProgressDto> {
    // 1. Consultar el perfil del usuario en Prisma junto con sus relaciones
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        skills: {
          include: { skill: true },
        },
        portfolioItems: true,
      },
    });

    // Validar completitud de cada paso
    const hasProfessionalInfo = Boolean(
      profile && profile.firstName && profile.lastName && profile.bio && profile.bio.trim().length > 0
    );

    // Habilidades
    const skillList = profile?.skills?.map((ps) => ps.skill.name) || [];
    const hasSkills = skillList.length > 0;

    // Portafolio
    const totalPortfolioItems = profile?.portfolioItems?.length || 0;
    const hasPortfolio = totalPortfolioItems > 0;

    const steps = [
      {
        stepNumber: 1,
        id: 'professional_info' as const,
        title: 'Información Profesional',
        description: 'Define tu título profesional, descripción y tarifa.',
        isCompleted: hasProfessionalInfo,
        data: {
          professionalTitle: profile ? `${profile.firstName} ${profile.lastName}` : null,
          bio: profile?.bio || null,
          hourlyRate: 25,
        },
      },
      {
        stepNumber: 2,
        id: 'portfolio' as const,
        title: 'Portafolio de Proyectos',
        description: 'Sube proyectos destacados para que los clientes vean tu trabajo.',
        isCompleted: hasPortfolio,
        data: {
          totalItems: totalPortfolioItems,
        },
      },
      {
        stepNumber: 3,
        id: 'skills' as const,
        title: 'Habilidades Técnicas',
        description: 'Selecciona tus tecnologías principales.',
        isCompleted: hasSkills,
        data: {
          skills: skillList,
        },
      },
    ];

    const completedSteps = steps.filter((s) => s.isCompleted).length;
    const percentage = Math.round((completedSteps / steps.length) * 100);

    return {
      totalSteps: steps.length,
      completedSteps,
      percentage,
      isFullyCompleted: completedSteps === steps.length,
      steps,
    };
  }
}
