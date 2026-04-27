import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PatientService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(search?: string) {
    return this.prisma.patient.findMany({
      where: {
        isActive: true,
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { startAt: 'desc' },
          take: 10,
          include: { doctor: true, center: true, visit: true },
        },
        testResults: {
          orderBy: { takenAt: 'desc' },
          take: 20,
          include: { test: true },
        },
      },
    });
    if (!patient) throw new NotFoundException(`Пациент #${id} не найден`);
    return patient;
  }

  create(dto: {
    userId?: number;
    fullName: string;
    birthDate?: string;
    phone?: string;
    email?: string;
    gender?: string;
    address?: string;
  }) {
    return this.prisma.patient.create({
      data: {
        userId: dto.userId,
        fullName: dto.fullName,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        phone: dto.phone,
        email: dto.email,
        gender: dto.gender,
        address: dto.address,
      },
    });
  }

  async update(
    id: number,
    dto: {
      fullName?: string;
      birthDate?: string;
      phone?: string;
      email?: string;
      gender?: string;
      address?: string;
    },
  ) {
    await this.findOne(id);
    return this.prisma.patient.update({
      where: { id },
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });
  }

  async findByUserId(userId: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      include: {
        appointments: {
          orderBy: { startAt: 'desc' },
          include: { doctor: true, center: true, visit: true, prediction: true },
        },
        testResults: {
          orderBy: { takenAt: 'desc' },
          include: { test: true },
        },
      },
    });
    if (!patient) throw new NotFoundException(`Пациент не найден для пользователя #${userId}`);
    return patient;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.patient.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  }
}
