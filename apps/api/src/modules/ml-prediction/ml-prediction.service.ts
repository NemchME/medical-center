import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MlPredictionService {
  constructor(private readonly prisma: PrismaService) {}

  findByAppointment(appointmentId: number) {
    return this.prisma.mlPrediction.findUnique({
      where: { appointmentId },
    });
  }
}
