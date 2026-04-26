import { Module } from '@nestjs/common';
import { MlPredictionModule } from '../ml-prediction/ml-prediction.module';
import { NotificationModule } from '../notification/notification.module';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';

@Module({
  imports: [MlPredictionModule, NotificationModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
