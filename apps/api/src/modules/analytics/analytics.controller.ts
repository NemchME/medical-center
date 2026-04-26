import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@medicina/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Аналитика')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Сводная аналитика клиники' })
  overview() {
    return this.analyticsService.overview();
  }

  @Get('appointments-by-month')
  @ApiOperation({ summary: 'Приёмы по месяцам (последние 12 мес)' })
  appointmentsByMonth() {
    return this.analyticsService.appointmentsByMonth();
  }

  @Get('doctor-load')
  @ApiOperation({ summary: 'Загрузка врачей за последние 30 дней' })
  doctorLoad() {
    return this.analyticsService.doctorLoad();
  }

  @Get('no-show-trend')
  @ApiOperation({ summary: 'Тренд неявок по месяцам' })
  noShowTrend() {
    return this.analyticsService.noShowTrend();
  }
}
