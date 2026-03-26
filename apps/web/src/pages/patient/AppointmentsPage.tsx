import { useState, useMemo } from 'react';
import { CalendarPlus, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { USE_MOCK, MOCK_APPOINTMENTS } from '@/data/mock';
import { AppointmentCard } from '@/components/shared/AppointmentCard';
import EmptyState from '@/components/ui/EmptyState';

type TabKey = 'upcoming' | 'past' | 'all';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'upcoming', label: 'Предстоящие' },
  { key: 'past', label: 'Прошедшие' },
  { key: 'all', label: 'Все' },
];

export function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');

  const patientAppointments = useMemo(() => {
    if (!USE_MOCK) return [];
    return MOCK_APPOINTMENTS.filter((a) => a.patientId === 1);
  }, []);

  const now = new Date();

  const filteredAppointments = useMemo(() => {
    switch (activeTab) {
      case 'upcoming':
        return patientAppointments.filter(
          (a) =>
            new Date(a.startAt) >= now &&
            !['completed', 'cancelled', 'no_show'].includes(a.status),
        );
      case 'past':
        return patientAppointments.filter(
          (a) =>
            new Date(a.startAt) < now ||
            ['completed', 'cancelled', 'no_show'].includes(a.status),
        );
      case 'all':
        return patientAppointments;
    }
  }, [activeTab, patientAppointments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Мои записи</h2>
        <button className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-700 active:scale-[0.98]">
          <CalendarPlus className="h-4 w-4" />
          Записаться на приём
        </button>
      </div>

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredAppointments.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Нет записей"
          description={
            activeTab === 'upcoming'
              ? 'У вас пока нет предстоящих записей на приём'
              : activeTab === 'past'
                ? 'У вас пока нет прошедших визитов'
                : 'У вас пока нет записей'
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              expandable={
                appointment.status === 'completed' && !!appointment.visit
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
