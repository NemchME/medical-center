import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DoctorScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  findByDoctor(doctorId: number) {
    return this.prisma.doctorSchedule.findMany({
      where: { doctorId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async upsert(
    doctorId: number,
    dto: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      slotMin?: number;
      isActive?: boolean;
    },
  ) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) throw new NotFoundException(`Врач #${doctorId} не найден`);

    return this.prisma.doctorSchedule.upsert({
      where: {
        doctorId_dayOfWeek: { doctorId, dayOfWeek: dto.dayOfWeek },
      },
      update: {
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotMin: dto.slotMin,
        isActive: dto.isActive,
      },
      create: {
        doctorId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotMin: dto.slotMin ?? 30,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async bulkSet(
    doctorId: number,
    items: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      slotMin?: number;
    }[],
  ) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) throw new NotFoundException(`Врач #${doctorId} не найден`);

    await this.prisma.doctorSchedule.deleteMany({ where: { doctorId } });

    return this.prisma.doctorSchedule.createMany({
      data: items.map((item) => ({
        doctorId,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        slotMin: item.slotMin ?? 30,
      })),
    });
  }
}
