import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PatientService } from './patient.service';

@ApiTags('Пациенты')
@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список пациентов' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('search') search?: string) {
    return this.patientService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить пациента по ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.patientService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать нового пациента' })
  create(
    @Body()
    dto: {
      userId?: number;
      fullName: string;
      birthDate?: string;
      phone?: string;
      email?: string;
      gender?: string;
      address?: string;
    },
  ) {
    return this.patientService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить данные пациента' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: {
      fullName?: string;
      birthDate?: string;
      phone?: string;
      email?: string;
      gender?: string;
      address?: string;
    },
  ) {
    return this.patientService.update(id, dto);
  }
}
