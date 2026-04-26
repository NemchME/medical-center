import { useMemo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { Pill, User, Calendar } from 'lucide-react';
import { appointmentsApi } from '@/api/appointments';
import type { Appointment, ID } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

interface PrescriptionRow {
  id: ID;
  text: string;
  status: string;
  doctorName: string;
  specialization: string;
  visitDate: string;
}

export function PrescriptionsPage() {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', 'mine'],
    queryFn: () => appointmentsApi.mine(),
  });

  const prescriptions = useMemo(() => {
    const completedVisits = appointments
      .filter(
        (a) =>
          a.status === 'completed' &&
          a.visit &&
          (a.visit.prescriptions?.length ?? 0) > 0,
      )
      .sort(
        (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
      );

    const grouped = new Map<string, PrescriptionRow[]>();

    completedVisits.forEach((apt: Appointment) => {
      if (!apt.visit) return;
      const label = format(new Date(apt.startAt), 'd MMMM yyyy', { locale: ru });

      const items: PrescriptionRow[] = (apt.visit.prescriptions ?? []).map((rx) => ({
        id: rx.id,
        text: rx.text,
        status: rx.status,
        doctorName: apt.doctor?.fullName ?? '—',
        specialization: apt.doctor?.specialization ?? '',
        visitDate: apt.startAt,
      }));

      const existing = grouped.get(label) ?? [];
      grouped.set(label, [...existing, ...items]);
    });

    return grouped;
  }, [appointments]);

  const totalCount = useMemo(() => {
    let count = 0;
    prescriptions.forEach((items) => (count += items.length));
    return count;
  }, [prescriptions]);

  if (isLoading) {
    return <div className="text-gray-500 text-center py-12">Загрузка…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Рецепты</h2>
        <p className="mt-1 text-sm text-gray-500">
          Все назначения из завершённых визитов
        </p>
      </div>

      {totalCount === 0 ? (
        <EmptyState
          icon={Pill}
          title="Нет рецептов"
          description="Назначения появятся здесь после завершённых визитов с рецептами"
        />
      ) : (
        <div className="space-y-8">
          {Array.from(prescriptions.entries()).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-purple-500" />
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  {dateLabel}
                </h3>
              </div>

              <div className="space-y-3">
                {items.map((rx) => (
                  <div
                    key={String(rx.id)}
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Pill className="h-4 w-4 text-purple-500 shrink-0" />
                          <p className="text-sm font-semibold text-gray-900">
                            {rx.text}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span>
                            {rx.doctorName}{' '}
                            {rx.specialization && (
                              <span className="text-purple-600">
                                ({rx.specialization})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <StatusBadge status={rx.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
