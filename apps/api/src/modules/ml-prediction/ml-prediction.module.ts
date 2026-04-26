import { Module } from '@nestjs/common';
import { MlPredictionController } from './ml-prediction.controller';
import { MlPredictionService } from './ml-prediction.service';

@Module({
  controllers: [MlPredictionController],
  providers: [MlPredictionService],
  exports: [MlPredictionService],
})
export class MlPredictionModule {}
