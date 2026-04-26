import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@medicina/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserService } from './user.service';

@ApiTags('Пользователи')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  getMe(@Req() req: { user?: { id: number } }) {
    const userId = req.user?.id ?? 0;
    return this.userService.findMe(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Обновить профиль текущего пользователя' })
  updateMe(
    @Req() req: { user?: { id: number } },
    @Body()
    dto: {
      fullName?: string;
      phone?: string;
      birthDate?: string;
      gender?: string;
      address?: string;
    },
  ) {
    const userId = req.user?.id ?? 0;
    return this.userService.updateProfile(userId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Список всех пользователей (admin)' })
  findAll() {
    return this.userService.findAll();
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Деактивировать пользователя (admin)' })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deactivate(id);
  }
}
