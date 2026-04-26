import { useState, useMemo } from 'react';
import { format, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { appointmentsApi, type AppointmentFilters } from '@/api/appointments';
import { patientsApi } from '@/api/patients';
import { doctorsApi } from '@/api/doctors';
import { centersApi } from '@/api/centers';
import type { Appointment } from '@/types';
import DataTable from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'confirmed', label: 'Подтверждён' },
  { value: 'completed', label: 'Завершён' },
  { value: 'cancelled', label: 'Отменён' },
  { value: 'no_show', label: 'Неявка' },
];

function NoShowIndicator({ probability }: { probability?: number }) {
  if (probability == null) return <span className="text-gray-300">--</span>;
  const pct = Math.round(probability * 100);
  const color =
    pct >= 30
      ? 'text-red-600 bg-red-50'
      : pct >= 15
        ? 'text-yellow-600 bg-yellow-50'
        : 'text-green-600 bg-green-50';
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', color)}>
      {pct}%
    </span>
  );
}

export function AdminAppointmentsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formPatient, setFormPatient] = useState('');
  const [formDoctor, setFormDoctor] = useState('');
  const [formCenter, setFormCenter] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDuration, setFormDuration] = useState('30');

  const filters: AppointmentFilters = useMemo(
    () => ({
      status: statusFilter || undefined,
      doctorId: doctorFilter ? Number(doctorFilter) : undefined,
      from: dateFrom || undefined,
      to: dateTo
        ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)).toISOString()
        : undefined,
    }),
    [statusFilter, doctorFilter, dateFrom, dateTo],
  );

  const { data: allAppointments = [], isLoading } = useQuery({
    queryKey: ['appointments', 'all'],
    queryFn: () => appointmentsApi.list(),
  });

  const { data: filtered = [] } = useQuery({
    queryKey: ['appointments', 'filtered', filters],
    queryFn: () => appointmentsApi.list(filters),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.list(),
  });
  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.list(),
  });
  const { data: centers = [] } = useQuery({
    queryKey: ['centers'],
    queryFn: () => centersApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      appointmentsApi.create({
        patientId: Number(formPatient),
        doctorId: Number(formDoctor),
        centerId: Number(formCenter),
        startAt: new Date(`${formDate}T${formTime}:00`).toISOString(),
        durationMin: Number(formDuration),
        sourceChannel: 'admin',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      setIsCreateOpen(false);
      setFormPatient('');
      setFormDoctor('');
      setFormCenter('');
      setFormDate('');
      setFormTime('');
      setFormDuration('30');
    },
  });

  const stats = useMemo(() => {
    const total = allAppointments.length;
    const today = allAppointments.filter((a) => isToday(new Date(a.startAt))).length;
    const confirmed = allAppointments.filter((a) => a.status === 'confirmed').length;
    const noShow = allAppointments.filter((a) => a.status === 'no_show').length;
    return { total, today, confirmed, noShow };
  }, [allAppointments]);

  type AppointmentRow = Appointment & Record<string, unknown>;

  const columns: Column<AppointmentRow>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      width: '60px',
      render: (row) => <span className="font-mono text-xs text-gray-500">#{String(row.id)}</span>,
    },
    {
      key: 'patientName',
      header: 'Пациент',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">{row.patient?.fullName ?? '—'}</span>
      ),
    },
    {
      key: 'doctorName',
      header: 'Врач',
      render: (row) => (
        <div>
          <p className="text-sm text-gray-900">{row.doctor?.fullName ?? '—'}</p>
          <p className="text-xs text-gray-500">{row.doctor?.specialization ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'centerName',
      header: 'Центр',
      render: (row) => <span className="text-sm text-gray-600">{row.center?.name ?? '—'}</span>,
    },
    {
      key: 'startAt',
      header: 'Дата/Время',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {format(new Date(row.startAt), 'd MMM yyyy', { locale: ru })}
          </p>
          <p className="text-xs text-gray-500">{format(new Date(row.startAt), 'HH:mm')}</p>
        </div>
      ),
    },
    {
      key: 'durationMin',
      header: 'Длительность',
      width: '110px',
      render: (row) => <span className="text-sm text-gray-600">{row.durationMin} мин</span>,
    },
    {
      key: 'status',
      header: 'Статус',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'prediction',
      header: 'Прогноз',
      width: '90px',
      render: (row) => <NoShowIndicator probability={row.prediction?.noShowProbability} />,
    },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} value={stats.total} label="Всего записей" />
        <StatCard icon={Calendar} value={stats.today} label="Сегодня" />
        <StatCard icon={CheckCircle2} value={stats.confirmed} label="Подтверждённые" />
        <StatCard icon={AlertTriangle} value={stats.noShow} label="Неявки" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-100 p-2.5">
            <CalendarCheck className="h-6 w-6 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Записи на приёмы</h2>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-purple-700"
        >
          <CalendarPlus className="h-4 w-4" />
          Создать запись
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-gray-500">Статус</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-gray-500">Врач</label>
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="">Все врачи</option>
            {doctors.map((d) => (
              <option key={String(d.id)} value={String(d.id)}>
                {d.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[150px]">
          <label className="mb-1 block text-xs font-medium text-gray-500">Дата от</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div className="min-w-[150px]">
          <label className="mb-1 block text-xs font-medium text-gray-500">Дата до</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        {(statusFilter || doctorFilter || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setDoctorFilter('');
              setDateFrom('');
              setDateTo('');
            }}
            className="rounded-lg px-3 py-2 text-sm text-purple-600 transition-colors hover:bg-purple-50"
          >
            Сбросить
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Показано: {filtered.length} из {allAppointments.length}
      </p>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Загрузка…</div>
      ) : (
        <DataTable
          data={filtered as unknown as Record<string, unknown>[]}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          emptyMessage="Нет записей с заданными фильтрами"
        />
      )}

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Создать запись на приём"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Пациент</label>
            <select
              value={formPatient}
              onChange={(e) => setFormPatient(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="">Выберите пациента</option>
              {patients.map((p) => (
                <option key={String(p.id)} value={String(p.id)}>
                  {p.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Врач</label>
            <select
              value={formDoctor}
              onChange={(e) => setFormDoctor(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="">Выберите врача</option>
              {doctors.map((d) => (
                <option key={String(d.id)} value={String(d.id)}>
                  {d.fullName} -- {d.specialization ?? ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Центр</label>
            <select
              value={formCenter}
              onChange={(e) => setFormCenter(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="">Выберите центр</option>
              {centers.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Дата</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Время</label>
              <input
                type="time"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Длительность</label>
              <select
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="15">15 мин</option>
                <option value="30">30 мин</option>
                <option value="45">45 мин</option>
                <option value="60">60 мин</option>
                <option value="90">90 мин</option>
              </select>
            </div>
          </div>

          {createMutation.isError && (
            <div className="text-sm text-red-600">
              Ошибка: {(createMutation.error as Error).message}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-purple-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Создание…' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
