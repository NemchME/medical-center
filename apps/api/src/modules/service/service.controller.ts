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
import { ServiceService } from './service.service';

@ApiTags('Услуги и анализы')
@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  @ApiOperation({ summary: 'Список медицинских услуг (публично)' })
  findAllServices() {
    return this.serviceService.findAllServices();
  }

  @Get('tests')
  @ApiOperation({ summary: 'Список лабораторных анализов (публично)' })
  findAllTests() {
    return this.serviceService.findAllTests();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Создать услугу (admin)' })
  createService(
    @Body()
    dto: {
      code: string;
      name: string;
      description?: string;
      durationMinDefault?: number;
    },
  ) {
    return this.serviceService.createService(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Обновить услугу (admin)' })
  updateService(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: {
      name?: string;
      description?: string;
      durationMinDefault?: number;
      isActive?: boolean;
    },
  ) {
    return this.serviceService.updateService(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Деактивировать услугу (admin)' })
  removeService(@Param('id', ParseIntPipe) id: number) {
    return this.serviceService.removeService(id);
  }

  @Post('tests')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Создать анализ (admin)' })
  createTest(
    @Body()
    dto: {
      code: string;
      name: string;
      description?: string;
      sampleType?: string;
      preparation?: string;
    },
  ) {
    return this.serviceService.createTest(dto);
  }

  @Patch('tests/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Обновить анализ (admin)' })
  updateTest(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: {
      name?: string;
      description?: string;
      sampleType?: string;
      preparation?: string;
      isActive?: boolean;
    },
  ) {
    return this.serviceService.updateTest(id, dto);
  }

  @Delete('tests/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Деактивировать анализ (admin)' })
  removeTest(@Param('id', ParseIntPipe) id: number) {
    return this.serviceService.removeTest(id);
  }

  @Post(':id/prices')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Установить цену услуги в центре (admin)' })
  setServicePrice(
    @Param('id', ParseIntPipe) serviceId: number,
    @Body() dto: { centerId: number; price: number; currency?: string },
  ) {
    return this.serviceService.setServicePrice(serviceId, dto);
  }

  @Post('tests/:id/prices')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Установить цену анализа в центре (admin)' })
  setTestPrice(
    @Param('id', ParseIntPipe) testId: number,
    @Body() dto: { centerId: number; price: number; currency?: string },
  ) {
    return this.serviceService.setTestPrice(testId, dto);
  }
}
