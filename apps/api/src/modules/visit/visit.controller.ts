import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VisitService } from './visit.service';

@ApiTags('Визиты')
@Controller('visits')
export class VisitController {
  constructor(private readonly visitService: VisitService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Получить визит по ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.visitService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать новый визит' })
  create(
    @Body()
    dto: {
      appointmentId: number;
      complaints?: string;
      notes?: string;
    },
  ) {
    return this.visitService.create(dto);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Закрыть визит' })
  close(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { notes?: string },
  ) {
    return this.visitService.close(id, dto.notes);
  }
}
