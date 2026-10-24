import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import { IUserRepository } from '../../domain/repositories/user.repository.interface.js';
import { UserNotFoundException, ResourceNotFoundException } from '../../domain/exceptions/domain.exception.js';

export class DeletePortfolioItemUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(userId: string, itemId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new ResourceNotFoundException('Perfil no encontrado para este usuario.');
    }

    const item = await prisma.portfolioItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.profileId !== profile.id) {
      throw new ResourceNotFoundException('Proyecto de portafolio no encontrado.');
    }

    await prisma.portfolioItem.delete({
      where: { id: itemId },
    });
  }
}
