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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@medicina/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NotificationService } from './notification.service';

@ApiTags('Уведомления')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Список уведомлений (admin)' })
  findAll(@Query('status') status?: string) {
    return this.notificationService.findAll(status);
  }

  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Уведомления по приёму' })
  findByAppointment(
    @Param('appointmentId', ParseIntPipe) appointmentId: number,
  ) {
    return this.notificationService.findByAppointment(appointmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить уведомление по ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать уведомление' })
  create(
    @Body()
    dto: {
      appointmentId: number;
      type: string;
      plannedAt: string;
    },
  ) {
    return this.notificationService.create(dto);
  }

  @Patch(':id/sent')
  @ApiOperation({ summary: 'Отметить как отправленное' })
  markSent(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.markSent(id);
  }

  @Patch(':id/failed')
  @ApiOperation({ summary: 'Отметить как не отправленное' })
  markFailed(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.markFailed(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить уведомление' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.remove(id);
  }
}
