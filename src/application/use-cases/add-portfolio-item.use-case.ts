import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import { PortfolioItemRequestDto } from '../validation/profile.schemas.js';
import { PortfolioItemDto } from '../dtos/profile.dto.js';
import { IUserRepository } from '../../domain/repositories/user.repository.interface.js';
import { UserNotFoundException } from '../../domain/exceptions/domain.exception.js';

export class AddPortfolioItemUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(
    userId: string,
    dto: PortfolioItemRequestDto
  ): Promise<PortfolioItemDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // Obtener o crear perfil
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

    const item = await prisma.portfolioItem.create({
      data: {
        profileId: profile.id,
        title: dto.title,
        description: dto.description,
        projectUrl: dto.projectUrl,
        imageUrl: dto.imageUrl || null,
      },
    });

    return {
      id: item.id,
      profileId: item.profileId,
      title: item.title,
      description: item.description,
      projectUrl: item.projectUrl,
      imageUrl: item.imageUrl,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
