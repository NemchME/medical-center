import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        roles: { include: { role: true } },
      },
    });
    if (!user) throw new NotFoundException(`Пользователь #${userId} не найден`);
    const { passwordHash: _, ...result } = user;
    return result;
  }
}
