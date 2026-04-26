import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@medicina/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(status?: string) {
    return this.prisma.notification.findMany({
      where: status ? { status } : undefined,
      include: { appointment: { include: { patient: true, doctor: true } } },
      orderBy: { plannedAt: 'desc' },
    });
  }

  findPending() {
    return this.findAll('pending');
  }

  findByAppointment(appointmentId: number) {
    return this.prisma.notification.findMany({
      where: { appointmentId },
      orderBy: { plannedAt: 'asc' },
    });
  }

  async findOne(id: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: { appointment: { include: { patient: true } } },
    });
    if (!notification) throw new NotFoundException(`Уведомление #${id} не найдено`);
    return notification;
  }

  create(dto: {
    appointmentId: number;
    type: NotificationType | string;
    plannedAt: string;
  }) {
    return this.prisma.notification.create({
      data: {
        appointmentId: dto.appointmentId,
        type: dto.type,
        plannedAt: new Date(dto.plannedAt),
        status: 'pending',
      },
    });
  }

  async markSent(id: number) {
    await this.findOne(id);
    return this.prisma.notification.update({
      where: { id },
      data: { status: 'sent', sentAt: new Date() },
    });
  }

  async markFailed(id: number) {
    await this.findOne(id);
    return this.prisma.notification.update({
      where: { id },
      data: { status: 'failed' },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.notification.delete({ where: { id } });
    return { success: true };
  }


  async scheduleStandardReminders(appointmentId: number, startAt: Date) {
    const remind24 = new Date(startAt.getTime() - 24 * 60 * 60 * 1000);
    const remind1 = new Date(startAt.getTime() - 60 * 60 * 1000);

    const created = [] as unknown[];
    if (remind24 > new Date()) {
      created.push(
        await this.prisma.notification.create({
          data: {
            appointmentId,
            type: NotificationType.REMINDER_24H,
            plannedAt: remind24,
            status: 'pending',
          },
        }),
      );
    }
    if (remind1 > new Date()) {
      created.push(
        await this.prisma.notification.create({
          data: {
            appointmentId,
            type: NotificationType.REMINDER_1H,
            plannedAt: remind1,
            status: 'pending',
          },
        }),
      );
    }
    return created;
  }
}
