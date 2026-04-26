import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@medicina/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DoctorScheduleService } from './doctor-schedule.service';

@ApiTags('Расписание врачей')
@Controller('doctors/:doctorId/schedule')
export class DoctorScheduleController {
  constructor(private readonly scheduleService: DoctorScheduleService) {}

  @Get()
  @ApiOperation({ summary: 'Получить расписание врача (публично)' })
  findByDoctor(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.scheduleService.findByDoctor(doctorId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR)
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR)
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
