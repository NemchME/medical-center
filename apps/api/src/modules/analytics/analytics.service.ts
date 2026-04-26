import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [
      totalPatients,
      totalAppointments,
      appointmentsByStatus,
      totalDoctors,
      totalCenters,
    ] = await Promise.all([
      this.prisma.patient.count(),
      this.prisma.appointment.count(),
      this.prisma.appointment.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.doctor.count(),
      this.prisma.clinicCenter.count({ where: { isActive: true } }),
    ]);

    const noShowGroup = appointmentsByStatus.find((g: {status: string; _count: {_all: number}}) => g.status === 'no_show');
    const completedGroup = appointmentsByStatus.find((g: {status: string; _count: {_all: number}}) => g.status === 'completed');
    const noShowCount = noShowGroup?._count._all ?? 0;
    const completedCount = completedGroup?._count._all ?? 0;
    const totalFinal = noShowCount + completedCount;
    const noShowRate = totalFinal > 0 ? noShowCount / totalFinal : 0;

    return {
      totalPatients,
      totalAppointments,
      totalDoctors,
      totalCenters,
      appointmentsByStatus: appointmentsByStatus.map((g: {status: string; _count: {_all: number}}) => ({
        status: g.status,
        count: g._count._all,
      })),
      noShowRate,
    };
  }

  async appointmentsByMonth() {
    const rows = await this.prisma.$queryRaw<
      { month: Date; count: bigint }[]
    >`SELECT date_trunc('month', start_at) AS month, COUNT(*) AS count
      FROM appointment
      WHERE start_at >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month`;
    return rows.map((r: {month: Date, count: bigint}) => ({
      month: r.month.toISOString().slice(0, 7),
      count: Number(r.count),
    }));
  }

  
  async doctorLoad() {
    const rows = await this.prisma.$queryRaw<
      { doctor_id: bigint; full_name: string; count: bigint }[]
    >`SELECT d.id AS doctor_id, d.full_name, COUNT(a.id) AS count
      FROM doctor d
      LEFT JOIN appointment a ON a.doctor_id = d.id
        AND a.start_at >= NOW() - INTERVAL '30 days'
      GROUP BY d.id, d.full_name
      ORDER BY count DESC`;
    return rows.map((r: {doctor_id: bigint ,full_name: string; count: bigint}) => ({
      doctorId: Number(r.doctor_id),
      fullName: r.full_name,
      count: Number(r.count),
    }));
  }

  async noShowTrend() {
    const rows = await this.prisma.$queryRaw<
      { month: Date; total: bigint; no_shows: bigint }[]
    >`SELECT date_trunc('month', start_at) AS month,
             COUNT(*) AS total,
             COUNT(*) FILTER (WHERE status = 'no_show') AS no_shows
      FROM appointment
      WHERE status IN ('completed', 'no_show')
        AND start_at >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month`;
    return rows.map((r: {month: Date, total: bigint, no_shows: bigint}) => ({
      month: r.month.toISOString().slice(0, 7),
      total: Number(r.total),
      noShows: Number(r.no_shows),
      rate: Number(r.total) > 0 ? Number(r.no_shows) / Number(r.total) : 0,
    }));
  }
}
