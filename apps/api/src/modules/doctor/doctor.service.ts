import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DoctorService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(centerId?: number) {
    return this.prisma.doctor.findMany({
      where: centerId ? { centerId } : undefined,
      include: { center: true, schedules: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async findOne(id: number) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        center: true,
        schedules: { orderBy: { dayOfWeek: 'asc' } },
        appointments: {
          orderBy: { startAt: 'desc' },
          take: 10,
          include: { patient: true },
        },
      },
    });
    if (!doctor) throw new NotFoundException(`Врач #${id} не найден`);
    return doctor;
  }

  create(dto: {
    userId?: number;
    centerId: number;
    fullName: string;
    specialization?: string;
    photoUrl?: string;
    experience?: string;
    education?: string;
    bio?: string;
  }) {
    return this.prisma.doctor.create({
      data: {
        userId: dto.userId,
        centerId: dto.centerId,
        fullName: dto.fullName,
        specialization: dto.specialization,
        photoUrl: dto.photoUrl,
        experience: dto.experience,
        education: dto.education,
        bio: dto.bio,
      },
      include: { center: true },
    });
  }

  async update(
    id: number,
    dto: {
      fullName?: string;
      specialization?: string;
      photoUrl?: string;
      experience?: string;
      education?: string;
      bio?: string;
      centerId?: number;
    },
  ) {
    await this.findOne(id);
    return this.prisma.doctor.update({
      where: { id },
      data: dto,
      include: { center: true },
    });
  }
}
