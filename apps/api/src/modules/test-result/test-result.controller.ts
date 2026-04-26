import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@medicina/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { TestResultService } from "./test-result.service";

@ApiTags("Результаты анализов")
@ApiBearerAuth()
@Controller("test-results")
@UseGuards(JwtAuthGuard)
export class TestResultController {
  constructor(private readonly testResultService: TestResultService) {}

  @Get("me")
  @ApiOperation({ summary: "Мои результаты анализов (пациент)" })
  findMine(@Req() req: { user?: { id: number } }) {
    return this.testResultService.findByPatientUserId(req.user?.id ?? 0);
  }

  @Get("patient/:patientId")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: "Получить результаты анализов пациента" })
  findByPatient(@Param("patientId", ParseIntPipe) patientId: number) {
    return this.testResultService.findByPatient(patientId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Получить результат по ID" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.testResultService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: "Добавить результат анализа" })
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

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: "Обновить результат анализа" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body()
    dto: {
      result?: string;
      unit?: string;
      refRange?: string;
      status?: string;
    },
  ) {
    return this.testResultService.update(id, dto);
  }

  @Patch(":id/ready")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: "Отметить результат как готовый" })
  markReady(@Param("id", ParseIntPipe) id: number) {
    return this.testResultService.markReady(id);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Удалить результат (admin)" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.testResultService.remove(id);
  }
}
