import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClinicCenterService } from './clinic-center.service';

@ApiTags('Клинические центры')
@Controller('centers')
export class ClinicCenterController {
  constructor(private readonly clinicCenterService: ClinicCenterService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список всех клинических центров' })
  findAll() {
    return this.clinicCenterService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить клинический центр по ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clinicCenterService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать новый клинический центр' })
  create(
    @Body()
    dto: {
      code: string;
      name: string;
      address?: string;
      phone?: string;
      email?: string;
      timezone?: string;
    },
  ) {
    return this.clinicCenterService.create(dto);
  }
}
