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
        prescriptions: { orderBy: { createdAt: 'desc' } },
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

  async update(
    id: number,
    dto: {
      complaints?: string;
      diagnosis?: string;
      examination?: string;
      notes?: string;
    },
  ) {
    await this.findOne(id);
    return this.prisma.visit.update({
      where: { id },
      data: dto,
      include: { prescriptions: true },
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

  async addPrescription(visitId: number, text: string) {
    await this.findOne(visitId);
    return this.prisma.prescription.create({
      data: { visitId, text },
    });
  }

  async removePrescription(prescriptionId: number) {
    await this.prisma.prescription.delete({ where: { id: prescriptionId } });
    return { success: true };
  }
}
