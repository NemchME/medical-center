import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@medicina/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MlPredictionService } from './ml-prediction.service';

@ApiTags('ML прогноз неявок')
@ApiBearerAuth()
@Controller('ml')
@UseGuards(JwtAuthGuard)
export class MlPredictionController {
  constructor(private readonly mlPredictionService: MlPredictionService) {}

  @Get('predictions/:appointmentId')
  @ApiOperation({ summary: 'Получить прогноз для приёма' })
  findByAppointment(@Param('appointmentId', ParseIntPipe) appointmentId: number) {
    return this.mlPredictionService.findByAppointment(appointmentId);
  }

  @Post('predictions/:appointmentId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Рассчитать и сохранить прогноз для приёма' })
  async predict(@Param('appointmentId', ParseIntPipe) appointmentId: number) {
    const probability = await this.mlPredictionService.predictAndSave(appointmentId);
    return { appointmentId, noShowProbability: probability };
  }

  @Post('reload')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Горячая перезагрузка ONNX-модели (admin)' })
  reload() {
    return this.mlPredictionService.reload();
  }
}
