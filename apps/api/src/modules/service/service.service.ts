import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  findAllServices() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      include: {
        prices: {
          where: { isActive: true },
          include: { center: true },
          orderBy: { validFrom: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  findAllTests() {
    return this.prisma.labTest.findMany({
      where: { isActive: true },
      include: {
        prices: {
          where: { isActive: true },
          include: { center: true },
          orderBy: { validFrom: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  createService(dto: {
    code: string;
    name: string;
    description?: string;
    durationMinDefault?: number;
  }) {
    return this.prisma.service.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        durationMinDefault: dto.durationMinDefault ?? 30,
      },
    });
  }

  async updateService(
    id: number,
    dto: {
      name?: string;
      description?: string;
      durationMinDefault?: number;
      isActive?: boolean;
    },
  ) {
    const svc = await this.prisma.service.findUnique({ where: { id } });
    if (!svc) throw new NotFoundException(`Услуга #${id} не найдена`);
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  async removeService(id: number) {
    const svc = await this.prisma.service.findUnique({ where: { id } });
    if (!svc) throw new NotFoundException(`Услуга #${id} не найдена`);
    await this.prisma.service.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }

  createTest(dto: {
    code: string;
    name: string;
    description?: string;
    sampleType?: string;
    preparation?: string;
  }) {
    return this.prisma.labTest.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        sampleType: dto.sampleType,
        preparation: dto.preparation,
      },
    });
  }

  async updateTest(
    id: number,
    dto: {
      name?: string;
      description?: string;
      sampleType?: string;
      preparation?: string;
      isActive?: boolean;
    },
  ) {
    const test = await this.prisma.labTest.findUnique({ where: { id } });
    if (!test) throw new NotFoundException(`Анализ #${id} не найден`);
    return this.prisma.labTest.update({ where: { id }, data: dto });
  }

  async removeTest(id: number) {
    const test = await this.prisma.labTest.findUnique({ where: { id } });
    if (!test) throw new NotFoundException(`Анализ #${id} не найден`);
    await this.prisma.labTest.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }

  async setServicePrice(
    serviceId: number,
    dto: { centerId: number; price: number; currency?: string },
  ) {
    await this.prisma.servicePrice.updateMany({
      where: { serviceId, centerId: dto.centerId, isActive: true },
      data: { isActive: false, validTo: new Date() },
    });
    return this.prisma.servicePrice.create({
      data: {
        serviceId,
        centerId: dto.centerId,
        price: dto.price,
        currency: dto.currency ?? 'RUB',
      },
    });
  }

  async setTestPrice(
    testId: number,
    dto: { centerId: number; price: number; currency?: string },
  ) {
    await this.prisma.testPrice.updateMany({
      where: { testId, centerId: dto.centerId, isActive: true },
      data: { isActive: false, validTo: new Date() },
    });
    return this.prisma.testPrice.create({
      data: {
        testId,
        centerId: dto.centerId,
        price: dto.price,
        currency: dto.currency ?? 'RUB',
      },
    });
  }
}
