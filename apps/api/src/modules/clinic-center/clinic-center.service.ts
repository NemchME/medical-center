import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClinicCenterService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.clinicCenter.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const center = await this.prisma.clinicCenter.findUnique({
      where: { id },
      include: { doctors: true },
    });
    if (!center) throw new NotFoundException(`Центр #${id} не найден`);
    return center;
  }

  create(dto: {
    code: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    timezone?: string;
  }) {
    return this.prisma.clinicCenter.create({
      data: {
        code: dto.code,
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        timezone: dto.timezone ?? 'Europe/Moscow',
      },
    });
  }

  async update(
    id: number,
    dto: {
      name?: string;
      address?: string;
      phone?: string;
      email?: string;
      timezone?: string;
      isActive?: boolean;
    },
  ) {
    await this.findOne(id);
    return this.prisma.clinicCenter.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.clinicCenter.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }
}
