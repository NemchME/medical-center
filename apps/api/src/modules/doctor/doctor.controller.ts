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
import { DoctorService } from './doctor.service';

@ApiTags('Врачи')
@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список всех врачей' })
  @ApiQuery({ name: 'centerId', required: false, type: Number })
  findAll(@Query('centerId') centerId?: string) {
    return this.doctorService.findAll(
      centerId ? parseInt(centerId, 10) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить врача по ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать нового врача' })
  create(
    @Body()
    dto: {
      userId?: number;
      centerId: number;
      fullName: string;
      specialization?: string;
      photoUrl?: string;
      experience?: string;
      education?: string;
      bio?: string;
    },
  ) {
    return this.doctorService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить данные врача' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: {
      fullName?: string;
      specialization?: string;
      photoUrl?: string;
      experience?: string;
      education?: string;
      bio?: string;
      centerId?: number;
    },
  ) {
    return this.doctorService.update(id, dto);
  }
}
