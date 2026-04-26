import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentStatus, UserRole } from '@medicina/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AppointmentService } from './appointment.service';

@ApiTags('Приёмы')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get('me')
  @ApiOperation({ summary: 'Приёмы текущего пациента' })
  findMine(@Req() req: { user?: { id: number } }) {
    return this.appointmentService.findByPatientUserId(req.user?.id ?? 0);
  }

  @Get('doctor/me')
  @ApiOperation({ summary: 'Приёмы текущего врача' })
  findMyDoctor(@Req() req: { user?: { id: number } }) {
    return this.appointmentService.findByDoctorUserId(req.user?.id ?? 0);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Получить список приёмов' })
  findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.appointmentService.findAll({
      patientId: patientId ? Number(patientId) : undefined,
      doctorId: doctorId ? Number(doctorId) : undefined,
      status,
      from,
      to,
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
      serviceIds?: number[];
      testIds?: number[];
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

  @Post(':id/services')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Добавить услугу к приёму' })
  addService(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { serviceId: number; qty?: number },
  ) {
    return this.appointmentService.addService(id, dto.serviceId, dto.qty ?? 1);
  }

  @Post(':id/tests')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Добавить анализ к приёму' })
  addTest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { testId: number; qty?: number },
  ) {
    return this.appointmentService.addTest(id, dto.testId, dto.qty ?? 1);
  }

  @Delete(':id/services/:serviceRowId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Удалить услугу из приёма' })
  removeService(@Param('serviceRowId', ParseIntPipe) serviceRowId: number) {
    return this.appointmentService.removeService(serviceRowId);
  }

  @Delete(':id/tests/:testRowId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Удалить анализ из приёма' })
  removeTest(@Param('testRowId', ParseIntPipe) testRowId: number) {
    return this.appointmentService.removeTest(testRowId);
  }
}
