import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, APPOINTMENT_TRANSITIONS } from '@medicina/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AppointmentService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query?: { patientId?: number; doctorId?: number; status?: string }) {
    return this.prisma.appointment.findMany({
      where: {
        ...(query?.patientId ? { patientId: query.patientId } : {}),
        ...(query?.doctorId ? { doctorId: query.doctorId } : {}),
        ...(query?.status ? { status: query.status } : {}),
      },
      include: {
        patient: true,
        doctor: true,
        center: true,
      },
      orderBy: { startAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        center: true,
        visit: true,
        services: true,
        tests: true,
      },
    });
    if (!appointment) throw new NotFoundException(`Приём #${id} не найден`);
    return appointment;
  }

  create(dto: {
    patientId: number;
    doctorId: number;
    centerId: number;
    startAt: string;
    durationMin?: number;
    sourceChannel?: string;
  }) {
    return this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        centerId: dto.centerId,
        startAt: new Date(dto.startAt),
        durationMin: dto.durationMin ?? 30,
        sourceChannel: dto.sourceChannel,
        status: AppointmentStatus.PENDING,
      },
      include: {
        patient: true,
        doctor: true,
        center: true,
      },
    });
  }

  async updateStatus(id: number, newStatus: AppointmentStatus) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException(`Приём #${id} не найден`);

    const currentStatus = appointment.status as AppointmentStatus;
    const allowed = APPOINTMENT_TRANSITIONS[currentStatus] ?? [];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Переход из статуса "${currentStatus}" в "${newStatus}" недопустим`,
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: newStatus },
    });
  }
}
