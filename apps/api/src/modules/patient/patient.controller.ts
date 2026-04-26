import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@medicina/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PatientService } from './patient.service';

@ApiTags('Пациенты')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get('me')
  @ApiOperation({ summary: 'Получить карточку текущего пациента' })
  findMe(@Req() req: { user?: { id: number } }) {
    return this.patientService.findByUserId(req.user?.id ?? 0);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Получить список пациентов' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('search') search?: string) {
    return this.patientService.findAll(search);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Получить пациента по ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.patientService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
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
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
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

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить пациента (admin)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.patientService.remove(id);
  }
}
