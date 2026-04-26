import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type RoleJoin = {role: {name: string}}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        profile: true,
        roles: { include: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(({ passwordHash: _pw, roles, ...u }: {passwordHash: string; roles: RoleJoin[]} & Record<string, unknown>) => ({
      ...u,
      roles: roles.map((r) => r.role.name),
    }));
  }

  async findMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        roles: { include: { role: true } },
        doctor: { include: { center: true, schedules: true } },
        patient: true,
      },
    });
    if (!user) throw new NotFoundException(`Пользователь #${userId} не найден`);
    const { passwordHash: _pw, roles, ...rest } = user;
    return {
      ...rest,
      roles: roles.map((r: RoleJoin) => r.role.name),
    };
  }

  async updateProfile(
    userId: number,
    dto: {
      fullName?: string;
      phone?: string;
      birthDate?: string;
      gender?: string;
      address?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`Пользователь #${userId} не найден`);

    if (dto.fullName) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { fullName: dto.fullName },
      });
    }

    await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        phone: dto.phone,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        gender: dto.gender,
        address: dto.address,
      },
      update: {
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.birthDate !== undefined
          ? { birthDate: dto.birthDate ? new Date(dto.birthDate) : null }
          : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
      },
    });

    return this.findMe(userId);
  }

  async deactivate(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`Пользователь #${userId} не найден`);
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    return { success: true };
  }
}
