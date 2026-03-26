import { useState, useMemo } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  AlertTriangle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  USE_MOCK,
  MOCK_APPOINTMENTS,
  MOCK_DOCTORS,
  type Appointment,
} from '@/data/mock';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import NoShowIndicator from '@/components/shared/NoShowIndicator';

const CURRENT_DOCTOR_ID = 1;

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);

const DAY_NAMES_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-50 border-blue-300 text-blue-900',
  pending: 'bg-yellow-50 border-yellow-300 text-yellow-900',
  completed: 'bg-green-50 border-green-300 text-green-900',
  cancelled: 'bg-gray-50 border-gray-300 text-gray-500 line-through',
  no_show: 'bg-red-50 border-red-300 text-red-900',
  in_progress: 'bg-purple-50 border-purple-300 text-purple-900',
};

function getAppointmentsData(): Appointment[] {
  if (USE_MOCK) {
    return MOCK_APPOINTMENTS.filter((a) => a.doctorId === CURRENT_DOCTOR_ID);
  }
  return [];
}

export function SchedulePage() {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(today, { weekStartsOn: 1 }),
  );
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const appointments = useMemo(() => getAppointmentsData(), []);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const weekEnd = addDays(weekStart, 6);

  const doctor = MOCK_DOCTORS.find((d) => d.id === CURRENT_DOCTOR_ID);

  const todayAppointments = appointments.filter((a) =>
    isSameDay(new Date(a.startAt), today),
  );
  const upcomingCount = appointments.filter(
    (a) =>
      new Date(a.startAt) > today &&
      a.status !== 'cancelled' &&
      a.status !== 'completed',
  ).length;
  const totalDone = appointments.filter(
    (a) => a.status === 'completed' || a.status === 'no_show',
  );
  const noShowCount = appointments.filter((a) => a.status === 'no_show').length;
  const noShowRate =
    totalDone.length > 0
      ? Math.round((noShowCount / totalDone.length) * 100)
      : 0;
  const getAppointmentsForDay = (day: Date) =>
    appointments.filter(
      (a) =>
        isSameDay(new Date(a.startAt), day) && a.status !== 'cancelled',
    );

  const getBlockStyle = (appointment: Appointment) => {
    const start = new Date(appointment.startAt);
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const topOffset = (startHour - 8) * 64 + (startMinute / 60) * 64;
    const height = (appointment.durationMin / 60) * 64;
    return { top: `${topOffset}px`, height: `${Math.max(height, 28)}px` };
  };

  const getWorkingHours = (day: Date) => {
    if (!doctor) return null;
    const dayOfWeek = (day.getDay() + 6) % 7; 
    return doctor.schedules.find((s) => s.dayOfWeek === dayOfWeek) || null;
  };

  const prevWeek = () => setWeekStart((w) => addDays(w, -7));
  const nextWeek = () => setWeekStart((w) => addDays(w, 7));
  const goToday = () => setWeekStart(startOfWeek(today, { weekStartsOn: 1 }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Расписание</h2>
        <button
          onClick={goToday}
          className="rounded-lg bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-200"
        >
          Сегодня
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarDays}
          value={todayAppointments.length}
          label="Приёмов сегодня"
        />
        <StatCard
          icon={Clock}
          value={upcomingCount}
          label="Предстоящих"
        />
        <StatCard
          icon={AlertTriangle}
          value={`${noShowRate}%`}
          label="Процент неявок"
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={prevWeek}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-purple-50 hover:text-purple-600"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-base font-semibold text-gray-900">
          {format(weekStart, 'd', { locale: ru })}
          {' \u2013 '}
          {format(weekEnd, 'd MMMM yyyy', { locale: ru })}
        </h3>
        <button
          onClick={nextWeek}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-purple-50 hover:text-purple-600"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[72px_repeat(7,1fr)] border-b border-gray-200 bg-purple-50/50">
              <div className="border-r border-gray-200 p-3" />
              {weekDays.map((day, idx) => {
                const isToday = isSameDay(day, today);
                const schedule = getWorkingHours(day);
                return (
                  <div
                    key={idx}
                    className={cn(
                      'border-r border-gray-200 p-3 text-center last:border-r-0',
                      isToday && 'bg-purple-100/60',
                    )}
                  >
                    <p
                      className={cn(
                        'text-xs font-medium uppercase tracking-wide',
                        isToday ? 'text-purple-700' : 'text-gray-500',
                      )}
                    >
                      {DAY_NAMES_SHORT[idx]}
                    </p>
                    <p
                      className={cn(
                        'mt-1 text-lg font-bold',
                        isToday ? 'text-purple-700' : 'text-gray-900',
                      )}
                    >
                      {format(day, 'd')}
                    </p>
                    {schedule && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {schedule.startTime} – {schedule.endTime}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-[72px_repeat(7,1fr)]">
              <div className="border-r border-gray-200">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="flex h-16 items-start justify-end border-b border-gray-100 pr-3 pt-1"
                  >
                    <span className="text-xs font-medium text-gray-400">
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {weekDays.map((day, dayIdx) => {
                const dayAppointments = getAppointmentsForDay(day);
                const isToday = isSameDay(day, today);
                const schedule = getWorkingHours(day);

                return (
                  <div
                    key={dayIdx}
                    className={cn(
                      'relative border-r border-gray-200 last:border-r-0',
                      isToday && 'bg-purple-50/30',
                    )}
                  >
                    {HOURS.map((hour) => {
                      const isWorking =
                        schedule &&
                        hour >= parseInt(schedule.startTime) &&
                        hour < parseInt(schedule.endTime);
                      return (
                        <div
                          key={hour}
                          className={cn(
                            'h-16 border-b border-gray-100',
                            isWorking
                              ? 'bg-white'
                              : 'bg-gray-50/60',
                          )}
                        />
                      );
                    })}

                    {dayAppointments.map((apt) => {
                      const style = getBlockStyle(apt);
                      const startTime = format(new Date(apt.startAt), 'HH:mm');
                      return (
                        <button
                          key={apt.id}
                          onClick={() => setSelectedAppointment(apt)}
                          style={style}
                          className={cn(
                            'absolute inset-x-1 z-10 cursor-pointer overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-left transition-shadow hover:shadow-md',
                            STATUS_COLORS[apt.status] ||
                              'bg-gray-50 border-gray-300',
                          )}
                        >
                          <p className="truncate text-xs font-semibold">
                            {apt.patient.fullName.split(' ').slice(0, 2).join(' ')}
                          </p>
                          <p className="text-[10px] opacity-75">{startTime}</p>
                        </button>
                      );
                    })}

                    {/* Current time indicator */}
                    {isToday && (() => {
                      const nowHour = today.getHours();
                      const nowMin = today.getMinutes();
                      if (nowHour < 8 || nowHour > 20) return null;
                      const topPx = (nowHour - 8) * 64 + (nowMin / 60) * 64;
                      return (
                        <div
                          className="absolute left-0 right-0 z-20 flex items-center"
                          style={{ top: `${topPx}px` }}
                        >
                          <div className="h-2.5 w-2.5 rounded-full bg-purple-600" />
                          <div className="h-[2px] flex-1 bg-purple-600" />
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Детали приёма
              </h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl bg-purple-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-200 font-bold text-purple-700">
                    {selectedAppointment.patient.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedAppointment.patient.fullName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedAppointment.patient.phone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Дата и время</span>
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(selectedAppointment.startAt), 'd MMMM yyyy, HH:mm', {
                      locale: ru,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Длительность
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedAppointment.durationMin} мин
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Статус</span>
                  <StatusBadge status={selectedAppointment.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Канал записи</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedAppointment.sourceChannel}
                  </span>
                </div>
                {selectedAppointment.prediction && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Риск неявки
                    </span>
                    <NoShowIndicator
                      probability={
                        selectedAppointment.prediction.noShowProbability
                      }
                    />
                  </div>
                )}
              </div>

              {selectedAppointment.visit && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-green-800">
                    Результат визита
                  </p>
                  <div className="space-y-1 text-sm text-green-900">
                    <p>
                      <span className="font-medium">Жалобы:</span>{' '}
                      {selectedAppointment.visit.complaints}
                    </p>
                    <p>
                      <span className="font-medium">Диагноз:</span>{' '}
                      {selectedAppointment.visit.diagnosis}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedAppointment(null)}
              className="mt-6 w-full rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
