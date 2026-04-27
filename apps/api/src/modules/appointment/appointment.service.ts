import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, APPOINTMENT_TRANSITIONS } from '@medicina/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MlPredictionService } from '../ml-prediction/ml-prediction.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mlPredictionService: MlPredictionService,
    private readonly notificationService: NotificationService,
  ) {}

  findAll(query?: {
    patientId?: number;
    doctorId?: number;
    status?: string;
    from?: string;
    to?: string;
  }) {
    return this.prisma.appointment.findMany({
      where: {
        ...(query?.patientId ? { patientId: query.patientId } : {}),
        ...(query?.doctorId ? { doctorId: query.doctorId } : {}),
        ...(query?.status ? { status: query.status } : {}),
        ...(query?.from || query?.to
          ? {
              startAt: {
                ...(query?.from ? { gte: new Date(query.from) } : {}),
                ...(query?.to ? { lte: new Date(query.to) } : {}),
              },
            }
          : {}),
      },
      include: {
        patient: true,
        doctor: true,
        center: true,
        prediction: true,
        visit: { include: { prescriptions: true } },
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
        visit: { include: { prescriptions: true } },
        services: { include: { service: true } },
        tests: { include: { test: true } },
        prediction: true,
      },
    });
    if (!appointment) throw new NotFoundException(`Приём #${id} не найден`);
    return appointment;
  }

  async findByPatientUserId(userId: number) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) return [];
    return this.findAll({ patientId: Number(patient.id) });
  }

  async findByDoctorUserId(userId: number) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) return [];
    return this.findAll({ doctorId: Number(doctor.id) });
  }

  async create(dto: {
    patientId: number;
    doctorId: number;
    centerId: number;
    startAt: string;
    durationMin?: number;
    sourceChannel?: string;
    serviceIds?: number[];
    testIds?: number[];
  }) {
    const appointment = await this.prisma.appointment.create({
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

    const appointmentId = Number(appointment.id);

    for (const serviceId of dto.serviceIds ?? []) {
      await this.addService(appointmentId, serviceId, 1);
    }
    for (const testId of dto.testIds ?? []) {
      await this.addTest(appointmentId, testId, 1);
    }

    try {
      await this.mlPredictionService.predictAndSave(appointmentId);
    } catch (err) {
      this.logger.warn(
        `ML prediction skipped for appointment #${appointment.id}: ${(err as Error).message}`,
      );
    }

    try {
      await this.notificationService.scheduleStandardReminders(
        appointmentId,
        appointment.startAt,
      );
    } catch (err) {
      this.logger.warn(
        `Notifications not scheduled for appointment #${appointment.id}: ${(err as Error).message}`,
      );
    }

    return this.findOne(appointmentId);
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

  async addService(appointmentId: number, serviceId: number, qty: number) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment) throw new NotFoundException(`Приём #${appointmentId} не найден`);

    const price = await this.prisma.servicePrice.findFirst({
      where: {
        serviceId,
        centerId: appointment.centerId,
        isActive: true,
      },
      orderBy: { validFrom: 'desc' },
    });
    if (!price) {
      throw new BadRequestException(
        `Нет активной цены для услуги #${serviceId} в центре #${appointment.centerId}`,
      );
    }

    return this.prisma.appointmentService.create({
      data: {
        appointmentId,
        serviceId,
        qty,
        unitPrice: price.price,
        totalPrice: Number(price.price) * qty,
      },
      include: { service: true },
    });
  }

  async addTest(appointmentId: number, testId: number, qty: number) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment) throw new NotFoundException(`Приём #${appointmentId} не найден`);

    const price = await this.prisma.testPrice.findFirst({
      where: {
        testId,
        centerId: appointment.centerId,
        isActive: true,
      },
      orderBy: { validFrom: 'desc' },
    });
    if (!price) {
      throw new BadRequestException(
        `Нет активной цены для анализа #${testId} в центре #${appointment.centerId}`,
      );
    }

    return this.prisma.appointmentTest.create({
      data: {
        appointmentId,
        testId,
        qty,
        unitPrice: price.price,
        totalPrice: Number(price.price) * qty,
      },
      include: { test: true },
    });
  }

  async removeService(rowId: number) {
    await this.prisma.appointmentService.delete({ where: { id: rowId } });
    return { success: true };
  }

  async removeTest(rowId: number) {
    await this.prisma.appointmentTest.delete({ where: { id: rowId } });
    return { success: true };
  }
}
