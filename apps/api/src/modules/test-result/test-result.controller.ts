import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TestResultService } from './test-result.service';

@ApiTags('Результаты анализов')
@Controller('test-results')
export class TestResultController {
  constructor(private readonly testResultService: TestResultService) {}

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Получить результаты анализов пациента' })
  findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.testResultService.findByPatient(patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить результат по ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.testResultService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Добавить результат анализа' })
  create(
    @Body()
    dto: {
      patientId: number;
      testId: number;
      result: string;
      unit?: string;
      refRange?: string;
      status?: string;
    },
  ) {
    return this.testResultService.create(dto);
  }

  @Patch(':id/ready')
  @ApiOperation({ summary: 'Отметить результат как готовый' })
  markReady(@Param('id', ParseIntPipe) id: number) {
    return this.testResultService.markReady(id);
  }
}
