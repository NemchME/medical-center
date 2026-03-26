import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VisitService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: number) {
    const visit = await this.prisma.visit.findUnique({
      where: { id },
      include: {
        appointment: {
          include: { patient: true, doctor: true, center: true },
        },
        prescriptions: true,
      },
    });
    if (!visit) throw new NotFoundException(`Визит #${id} не найден`);
    return visit;
  }

  create(dto: {
    appointmentId: number;
    complaints?: string;
    diagnosis?: string;
    examination?: string;
    notes?: string;
  }) {
    return this.prisma.visit.create({
      data: {
        appointmentId: dto.appointmentId,
        complaints: dto.complaints,
        diagnosis: dto.diagnosis,
        examination: dto.examination,
        notes: dto.notes,
      },
      include: {
        appointment: true,
        prescriptions: true,
      },
    });
  }

  async close(id: number, notes?: string) {
    const visit = await this.prisma.visit.findUnique({ where: { id } });
    if (!visit) throw new NotFoundException(`Визит #${id} не найден`);

    return this.prisma.visit.update({
      where: { id },
      data: {
        closedAt: new Date(),
        ...(notes !== undefined ? { notes } : {}),
      },
      include: { prescriptions: true },
    });
  }
}
