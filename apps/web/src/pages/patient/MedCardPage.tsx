import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  Pill,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { USE_MOCK, MOCK_APPOINTMENTS } from '@/data/mock';
import type { Appointment } from '@/data/mock';
import DataTable from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

export function MedCardPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const completedVisits = useMemo(() => {
    if (!USE_MOCK) return [];
    return MOCK_APPOINTMENTS.filter(
      (a) => a.patientId === 1 && a.status === 'completed' && a.visit,
    ).sort(
      (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
    );
  }, []);

  const columns: Column<Appointment>[] = [
    {
      key: 'startAt',
      header: 'Дата',
      sortable: true,
      width: '140px',
      render: (row) => (
        <span className="text-gray-900 font-medium">
          {format(new Date(row.startAt), 'd MMM yyyy', { locale: ru })}
        </span>
      ),
    },
    {
      key: 'doctorName',
      header: 'Врач',
      render: (row) => (
        <span className="text-gray-900">{row.doctor.fullName}</span>
      ),
    },
    {
      key: 'specialization',
      header: 'Специализация',
      render: (row) => (
        <span className="text-purple-600 font-medium">
          {row.doctor.specialization}
        </span>
      ),
    },
    {
      key: 'diagnosis',
      header: 'Диагноз',
      render: (row) => (
        <span className="text-gray-700">
          {row.visit?.diagnosis || '\u2014'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      width: '120px',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'expand',
      header: '',
      width: '48px',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpandedId(expandedId === row.id ? null : row.id);
          }}
          className="rounded-lg p-1 text-gray-400 hover:bg-purple-50 hover:text-purple-600 transition-colors"
        >
          {expandedId === row.id ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      ),
    },
  ];

  if (completedVisits.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Медицинская карта
        </h2>
        <EmptyState
          icon={ClipboardList}
          title="Нет записей в медицинской карте"
          description="Протоколы визитов появятся здесь после завершённых приёмов"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Медицинская карта
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Протоколы завершённых визитов
        </p>
      </div>

      <DataTable
        data={completedVisits as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        onRowClick={(row) => {
          const apt = row as unknown as Appointment;
          setExpandedId(expandedId === apt.id ? null : apt.id);
        }}
      />

      {expandedId !== null && (() => {
        const apt = completedVisits.find((a) => a.id === expandedId);
        if (!apt?.visit) return null;

        return (
          <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-6 space-y-5 animate-in fade-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Протокол визита —{' '}
              {format(new Date(apt.startAt), 'd MMMM yyyy', { locale: ru })}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 text-purple-500" />
                  Жалобы
                </div>
                <p className="text-sm text-gray-600">
                  {apt.visit.complaints}
                </p>
              </div>

              <div className="rounded-xl bg-white p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  Осмотр
                </div>
                <p className="text-sm text-gray-600">
                  {apt.visit.examination || '\u2014'}
                </p>
              </div>

              <div className="rounded-xl bg-white p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <ClipboardList className="h-4 w-4 text-purple-500" />
                  Диагноз
                </div>
                <p className="text-sm text-gray-900 font-medium">
                  {apt.visit.diagnosis}
                </p>
              </div>

              {apt.visit.notes && (
                <div className="rounded-xl bg-white p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    Заметки
                  </div>
                  <p className="text-sm text-gray-600 italic">
                    {apt.visit.notes}
                  </p>
                </div>
              )}
            </div>

            {apt.visit.prescriptions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Pill className="h-4 w-4 text-purple-500" />
                  Назначения
                </div>
                <div className="space-y-2">
                  {apt.visit.prescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm border border-gray-100 shadow-sm"
                    >
                      <span className="text-gray-700">{rx.text}</span>
                      <StatusBadge status={rx.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
