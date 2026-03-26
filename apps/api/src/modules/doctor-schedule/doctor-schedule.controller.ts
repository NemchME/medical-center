import { Body, Controller, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DoctorScheduleService } from './doctor-schedule.service';

@ApiTags('Расписание врачей')
@Controller('doctors/:doctorId/schedule')
export class DoctorScheduleController {
  constructor(private readonly scheduleService: DoctorScheduleService) {}

  @Get()
  @ApiOperation({ summary: 'Получить расписание врача' })
  findByDoctor(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.scheduleService.findByDoctor(doctorId);
  }

  @Post()
  @ApiOperation({ summary: 'Добавить/обновить день расписания' })
  upsert(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Body()
    dto: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      slotMin?: number;
      isActive?: boolean;
    },
  ) {
    return this.scheduleService.upsert(doctorId, dto);
  }

  @Put()
  @ApiOperation({ summary: 'Установить всё расписание врача' })
  bulkSet(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Body()
    items: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      slotMin?: number;
    }[],
  ) {
    return this.scheduleService.bulkSet(doctorId, items);
  }
}