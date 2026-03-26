import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  findPending() {
    return this.prisma.notification.findMany({
      where: { status: 'pending' },
      include: { appointment: { include: { patient: true } } },
      orderBy: { plannedAt: 'asc' },
    });
  }
}
