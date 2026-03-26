import { Module } from '@nestjs/common';
import { ClinicCenterController } from './clinic-center.controller';
import { ClinicCenterService } from './clinic-center.service';

@Module({
  controllers: [ClinicCenterController],
  providers: [ClinicCenterService],
  exports: [ClinicCenterService],
})
export class ClinicCenterModule {}
