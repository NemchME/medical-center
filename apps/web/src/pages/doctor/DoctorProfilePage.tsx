import { useMemo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  User,
  GraduationCap,
  Briefcase,
  MapPin,
  CalendarDays,
  Users,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  USE_MOCK,
  MOCK_DOCTORS,
  MOCK_APPOINTMENTS,
  type Doctor,
  type Appointment,
} from '@/data/mock';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';

const CURRENT_DOCTOR_ID = 1;

const DAY_NAMES: Record<number, string> = {
  0: 'Понедельник',
  1: 'Вторник',
  2: 'Среда',
  3: 'Четверг',
  4: 'Пятница',
  5: 'Суббота',
  6: 'Воскресенье',
};

function getDoctorData(): { doctor: Doctor | null; appointments: Appointment[] } {
  if (!USE_MOCK) return { doctor: null, appointments: [] };

  const doctor = MOCK_DOCTORS.find((d) => d.id === CURRENT_DOCTOR_ID) || null;
  const appointments = MOCK_APPOINTMENTS.filter(
    (a) => a.doctorId === CURRENT_DOCTOR_ID,
  );
  return { doctor, appointments };
}

export function DoctorProfilePage() {
  const { doctor, appointments } = useMemo(() => getDoctorData(), []);

  if (!doctor) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Профиль не найден
      </div>
    );
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const appointmentsThisMonth = appointments.filter((a) => {
    const d = new Date(a.startAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const uniquePatientIds = [
    ...new Set(appointments.map((a) => a.patientId)),
  ];
  const totalPatients = uniquePatientIds.length;

  const completedAppointments = appointments.filter(
    (a) => a.status === 'completed' || a.status === 'no_show',
  );
  const noShowCount = appointments.filter(
    (a) => a.status === 'no_show',
  ).length;
  const noShowRate =
    completedAppointments.length > 0
      ? Math.round((noShowCount / completedAppointments.length) * 100)
      : 0;

  const workingDaysInMonth = doctor.schedules.length > 0 ? 20 : 0;
  const avgPerDay =
    workingDaysInMonth > 0
      ? (appointmentsThisMonth.length / workingDaysInMonth).toFixed(1)
      : '0';

  const recentAppointments = [...appointments]
    .sort(
      (a, b) =>
        new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
    )
    .slice(0, 5);

  const sortedSchedules = [...doctor.schedules].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek,
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Профиль</h2>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="h-32 bg-gradient-to-r from-purple-600 to-purple-400" />
        <div className="relative px-6 pb-6">
          <div className="-mt-16 flex flex-col items-start gap-6 sm:flex-row sm:items-end">
            <img
              src={doctor.photoUrl}
              alt={doctor.fullName}
              className="h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-lg"
            />
            <div className="flex-1 pt-2">
              <h3 className="text-xl font-bold text-gray-900">
                {doctor.fullName}
              </h3>
              <p className="mt-1 text-purple-600 font-medium">
                {doctor.specialization}
              </p>
              <p className="mt-2 text-sm text-gray-500">{doctor.bio}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-700">
              <Briefcase className="h-4 w-4" />
              <span>Стаж: {doctor.experience}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-700">
              <GraduationCap className="h-4 w-4" />
              <span>{doctor.education}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-700">
              <MapPin className="h-4 w-4" />
              <span>{doctor.center.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Статистика
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            value={totalPatients}
            label="Всего пациентов"
          />
          <StatCard
            icon={CalendarDays}
            value={appointmentsThisMonth.length}
            label="Приёмов в этом месяце"
          />
          <StatCard
            icon={TrendingUp}
            value={avgPerDay}
            label="Среднее в день"
          />
          <StatCard
            icon={AlertTriangle}
            value={`${noShowRate}%`}
            label="Процент неявок"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Расписание
          </h3>
          {sortedSchedules.length === 0 ? (
            <p className="text-sm text-gray-400">Расписание не задано</p>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 7 }, (_, i) => i).map((dayIdx) => {
                const schedule = sortedSchedules.find(
                  (s) => s.dayOfWeek === dayIdx,
                );
                return (
                  <div
                    key={dayIdx}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-4 py-3',
                      schedule
                        ? 'bg-purple-50'
                        : 'bg-gray-50',
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm font-medium',
                        schedule ? 'text-gray-900' : 'text-gray-400',
                      )}
                    >
                      {DAY_NAMES[dayIdx]}
                    </span>
                    {schedule ? (
                      <span className="rounded-lg bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                        {schedule.startTime} – {schedule.endTime}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Выходной</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Последние приёмы
          </h3>
          {recentAppointments.length === 0 ? (
            <p className="text-sm text-gray-400">Нет приёмов</p>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 transition-colors hover:bg-purple-50/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">
                      {apt.patient.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {apt.patient.fullName
                          .split(' ')
                          .slice(0, 2)
                          .join(' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(
                          new Date(apt.startAt),
                          'd MMM yyyy, HH:mm',
                          { locale: ru },
                        )}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
