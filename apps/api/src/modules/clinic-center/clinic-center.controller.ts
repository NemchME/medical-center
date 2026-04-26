import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@medicina/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClinicCenterService } from './clinic-center.service';

@ApiTags('Клинические центры')
@Controller('centers')
export class ClinicCenterController {
  constructor(private readonly clinicCenterService: ClinicCenterService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список клинических центров (публично)' })
  findAll() {
    return this.clinicCenterService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить клинический центр по ID (публично)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clinicCenterService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Создать новый клинический центр (admin)' })
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

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Обновить клинический центр (admin)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: {
      name?: string;
      address?: string;
      phone?: string;
      email?: string;
      timezone?: string;
      isActive?: boolean;
    },
  ) {
    return this.clinicCenterService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Деактивировать клинический центр (admin)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clinicCenterService.remove(id);
  }
}
