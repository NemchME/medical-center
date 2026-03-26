import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentStatus } from '@medicina/shared';
import { AppointmentService } from './appointment.service';

@ApiTags('Приёмы')
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список приёмов' })
  findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('status') status?: string,
  ) {
    return this.appointmentService.findAll({
      patientId: patientId ? Number(patientId) : undefined,
      doctorId: doctorId ? Number(doctorId) : undefined,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить приём по ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать новый приём' })
  create(
    @Body()
    dto: {
      patientId: number;
      doctorId: number;
      centerId: number;
      startAt: string;
      durationMin?: number;
      sourceChannel?: string;
    },
  ) {
    return this.appointmentService.create(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Обновить статус приёма' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { status: AppointmentStatus },
  ) {
    return this.appointmentService.updateStatus(id, dto.status);
  }
}
