import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceService } from './service.service';

@ApiTags('Услуги и анализы')
@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список медицинских услуг' })
  findAllServices() {
    return this.serviceService.findAllServices();
  }

  @Get('tests')
  @ApiOperation({ summary: 'Получить список лабораторных анализов' })
  findAllTests() {
    return this.serviceService.findAllTests();
  }
}
