import { Module } from '@nestjs/common';
import { MlPredictionService } from './ml-prediction.service';

@Module({
  providers: [MlPredictionService],
  exports: [MlPredictionService],
})
export class MlPredictionModule {}
