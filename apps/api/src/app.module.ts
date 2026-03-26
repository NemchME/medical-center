import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PatientModule } from './modules/patient/patient.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { ClinicCenterModule } from './modules/clinic-center/clinic-center.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { VisitModule } from './modules/visit/visit.module';
import { ServiceModule } from './modules/service/service.module';
import { DoctorScheduleModule } from './modules/doctor-schedule/doctor-schedule.module';
import { TestResultModule } from './modules/test-result/test-result.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    PatientModule,
    DoctorModule,
    DoctorScheduleModule,
    ClinicCenterModule,
    AppointmentModule,
    VisitModule,
    ServiceModule,
    TestResultModule,
  ],
})
export class AppModule {}
