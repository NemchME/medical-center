import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { notificationsApi } from '@/api/notifications';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import type { Notification } from '@/types';

const STATUS_FILTERS = [
  { value: '', label: 'Все' },
  { value: 'pending', label: 'Ожидают' },
  { value: 'sent', label: 'Отправлены' },
  { value: 'failed', label: 'Ошибка' },
];

const TYPE_LABELS: Record<string, string> = {
  reminder_24h: 'Напоминание (24ч)',
  reminder_1h: 'Напоминание (1ч)',
  cancellation: 'Отмена',
  confirmation: 'Подтверждение',
};

export function AdminNotificationsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['notifications', status],
    queryFn: () => notificationsApi.list(status || undefined),
  });

  const markSent = useMutation({
    mutationFn: (id: number | string) => notificationsApi.markSent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markFailed = useMutation({
    mutationFn: (id: number | string) => notificationsApi.markFailed(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const remove = useMutation({
    mutationFn: (id: number | string) => notificationsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const columns: Column<Notification>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '70px',
      render: (row) => <span className="font-mono text-xs text-gray-500">#{String(row.id)}</span>,
    },
    {
      key: 'type',
      header: 'Тип',
      render: (row) => (
        <span className="text-sm text-gray-900">{TYPE_LABELS[row.type] ?? row.type}</span>
      ),
    },
    {
      key: 'appointment',
      header: 'Приём',
      render: (row) => (
        <div className="text-sm">
          <div className="text-gray-900">
            {row.appointment?.patient?.fullName ?? '—'}
          </div>
          <div className="text-xs text-gray-500">
            {row.appointment?.doctor?.fullName ?? ''}
          </div>
        </div>
      ),
    },
    {
      key: 'plannedAt',
      header: 'Запланировано',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-700">
          {format(new Date(row.plannedAt), 'd MMM yyyy, HH:mm', { locale: ru })}
        </span>
      ),
    },
    {
      key: 'sentAt',
      header: 'Отправлено',
      render: (row) =>
        row.sentAt ? (
          <span className="text-sm text-gray-700">
            {format(new Date(row.sentAt), 'd MMM, HH:mm', { locale: ru })}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Статус',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      width: '140px',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.status === 'pending' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markSent.mutate(row.id);
                }}
                className="rounded-lg p-1.5 text-green-600 hover:bg-green-50"
                title="Отметить отправленным"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markFailed.mutate(row.id);
                }}
                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                title="Отметить не доставленным"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Удалить уведомление?')) remove.mutate(row.id);
            }}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
            title="Удалить"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-purple-100 p-2.5">
          <Bell className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Уведомления</h2>
          <p className="text-sm text-gray-500">Всего: {items.length}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              status === f.value
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Загрузка…</div>
      ) : (
        <DataTable
          data={items as unknown as Record<string, unknown>[]}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          emptyMessage="Нет уведомлений"
        />
      )}
    </div>
  );
}
