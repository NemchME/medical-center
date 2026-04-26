import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TestResultService {
  constructor(private readonly prisma: PrismaService) {}

  findByPatient(patientId: number) {
    return this.prisma.testResult.findMany({
      where: { patientId },
      include: { test: true },
      orderBy: { takenAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const result = await this.prisma.testResult.findUnique({
      where: { id },
      include: { test: true, patient: true },
    });
    if (!result) throw new NotFoundException(`Результат #${id} не найден`);
    return result;
  }

  create(dto: {
    patientId: number;
    testId: number;
    result: string;
    unit?: string;
    refRange?: string;
    status?: string;
  }) {
    return this.prisma.testResult.create({
      data: {
        patientId: dto.patientId,
        testId: dto.testId,
        result: dto.result,
        unit: dto.unit,
        refRange: dto.refRange,
        status: dto.status ?? 'pending',
      },
      include: { test: true },
    });
  }

  async markReady(id: number) {
    await this.findOne(id);
    return this.prisma.testResult.update({
      where: { id },
      data: { status: 'ready', readyAt: new Date() },
      include: { test: true },
    });
  }

  async update(
    id: number,
    dto: { result?: string; unit?: string; refRange?: string; status?: string },
  ) {
    await this.findOne(id);
    return this.prisma.testResult.update({
      where: { id },
      data: dto,
      include: { test: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.testResult.delete({ where: { id } });
    return { success: true };
  }

  async findByPatientUserId(userId: number) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) return [];
    return this.findByPatient(Number(patient.id));
  }
}
