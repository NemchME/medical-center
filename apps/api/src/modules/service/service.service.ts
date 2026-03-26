import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  findAllServices() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  findAllTests() {
    return this.prisma.labTest.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
