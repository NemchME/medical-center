import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Stethoscope,
  Save,
  Pill,
  Plus,
  Trash2,
  CheckCircle2,
  Play,
  AlertCircle,
} from 'lucide-react';
import { appointmentsApi } from '@/api/appointments';
import { visitsApi } from '@/api/visits';
import StatusBadge from '@/components/ui/StatusBadge';
import NoShowIndicator from '@/components/shared/NoShowIndicator';
import { cn } from '@/lib/utils';

export function VisitPage() {
  const { id } = useParams<{ id: string }>();
  const appointmentId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentsApi.get(appointmentId),
    enabled: !!appointmentId,
  });

  const visit = appointment?.visit;
  const isClosed = !!visit?.closedAt;

  const [form, setForm] = useState({
    complaints: '',
    diagnosis: '',
    examination: '',
    notes: '',
  });

  useEffect(() => {
    if (visit) {
      setForm({
        complaints: visit.complaints ?? '',
        diagnosis: visit.diagnosis ?? '',
        examination: visit.examination ?? '',
        notes: visit.notes ?? '',
      });
    }
  }, [visit]);

  const startVisit = useMutation({
    mutationFn: async () => {
      if (appointment?.status !== 'in_progress') {
        await appointmentsApi.updateStatus(appointmentId, 'in_progress');
      }
      if (!visit) {
        await visitsApi.create({ appointmentId });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointment', appointmentId] }),
  });

  const saveVisit = useMutation({
    mutationFn: () => {
      if (!visit) throw new Error('Визит не создан');
      return visitsApi.update(Number(visit.id), form);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointment', appointmentId] }),
  });

  const closeVisit = useMutation({
    mutationFn: async () => {
      if (!visit) throw new Error('Визит не создан');
      await visitsApi.update(Number(visit.id), form);
      await visitsApi.close(Number(visit.id));
      await appointmentsApi.updateStatus(appointmentId, 'completed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointment', appointmentId] }),
  });

  const [rxText, setRxText] = useState('');

  const addRx = useMutation({
    mutationFn: () => {
      if (!visit) throw new Error('Визит не создан');
      return visitsApi.addPrescription(Number(visit.id), rxText);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      setRxText('');
    },
  });

  const removeRx = useMutation({
    mutationFn: (rxId: number) => visitsApi.removePrescription(rxId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointment', appointmentId] }),
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Загрузка приёма…</div>;
  }

  if (!appointment) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">
        Приём не найден
      </div>
    );
  }

  const canStart =
    appointment.status === 'confirmed' || appointment.status === 'pending';
  const canEdit = appointment.status === 'in_progress' && !isClosed;
  const canClose = !!visit && !isClosed;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Приём пациента</h2>
          <p className="text-sm text-gray-500">ID #{String(appointment.id)}</p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="flex items-center gap-4 sm:flex-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-xl font-bold text-purple-700">
              {(appointment.patient?.fullName ?? 'U').charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {appointment.patient?.fullName ?? '—'}
              </h3>
              <div className="text-sm text-gray-500 space-y-0.5 mt-1">
                {appointment.patient?.birthDate && (
                  <div>
                    Дата рождения:{' '}
                    {format(new Date(appointment.patient.birthDate), 'd MMMM yyyy', { locale: ru })}
                  </div>
                )}
                {appointment.patient?.phone && (
                  <div>Телефон: {appointment.patient.phone}</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm sm:w-80">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span>
                {format(new Date(appointment.startAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4 text-purple-500" />
              <span>{appointment.durationMin} мин</span>
            </div>
            {appointment.center?.name && (
              <div className="flex items-center gap-2 text-gray-600">
                <Stethoscope className="h-4 w-4 text-purple-500" />
                <span>{appointment.center.name}</span>
              </div>
            )}
            {appointment.prediction && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Риск неявки:</span>
                <NoShowIndicator probability={appointment.prediction.noShowProbability} />
              </div>
            )}
          </div>
        </div>
      </div>

      {canStart && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-purple-900">Приём ещё не начат</p>
            <p className="text-sm text-purple-700 mt-0.5">
              Нажмите «Начать приём», чтобы создать карточку визита и приступить к ведению.
            </p>
          </div>
          <button
            onClick={() => startVisit.mutate()}
            disabled={startVisit.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {startVisit.isPending ? 'Начало…' : 'Начать приём'}
          </button>
        </div>
      )}

      {visit && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Карточка визита</h3>
            {isClosed && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Закрыт {format(new Date(visit.closedAt!), 'd MMM HH:mm', { locale: ru })}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Field label="Жалобы">
              <textarea
                value={form.complaints}
                onChange={(e) => setForm({ ...form, complaints: e.target.value })}
                disabled={!canEdit}
                rows={2}
                className={inputCls}
                placeholder="Что беспокоит пациента"
              />
            </Field>
            <Field label="Объективный осмотр">
              <textarea
                value={form.examination}
                onChange={(e) => setForm({ ...form, examination: e.target.value })}
                disabled={!canEdit}
                rows={3}
                className={inputCls}
                placeholder="Результаты осмотра, перкуссии, пальпации, аускультации"
              />
            </Field>
            <Field label="Диагноз">
              <input
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                disabled={!canEdit}
                className={inputCls}
                placeholder="Например: J06.9 ОРВИ"
              />
            </Field>
            <Field label="Заметки">
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={!canEdit}
                rows={2}
                className={inputCls}
                placeholder="Рекомендации, контрольная явка"
              />
            </Field>
          </div>

          {canEdit && (
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => saveVisit.mutate()}
                disabled={saveVisit.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-5 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saveVisit.isPending ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          )}

          {saveVisit.isError && (
            <div className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {(saveVisit.error as any)?.response?.data?.message ?? 'Не удалось сохранить'}
            </div>
          )}
        </div>
      )}

      {visit && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Назначения и рецепты</h3>
          </div>

          {visit.prescriptions && visit.prescriptions.length > 0 ? (
            <div className="space-y-2">
              {visit.prescriptions.map((rx) => (
                <div
                  key={String(rx.id)}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-purple-50/50 px-4 py-3"
                >
                  <div className="flex-1 text-sm text-gray-900">{rx.text}</div>
                  {canEdit && (
                    <button
                      onClick={() => removeRx.mutate(Number(rx.id))}
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Назначений ещё нет</p>
          )}

          {canEdit && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (rxText.trim()) addRx.mutate();
              }}
              className="flex gap-2 pt-2"
            >
              <input
                value={rxText}
                onChange={(e) => setRxText(e.target.value)}
                placeholder="Например: Парацетамол 500мг 3 раза в день — 5 дней"
                className={cn(inputCls, 'flex-1')}
              />
              <button
                type="submit"
                disabled={addRx.isPending || !rxText.trim()}
                className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Добавить
              </button>
            </form>
          )}
        </div>
      )}

      {canClose && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-green-900">Завершить приём</p>
            <p className="text-sm text-green-700 mt-0.5">
              Сохранит данные визита, проставит время закрытия и переведёт приём в статус
              «завершён».
            </p>
          </div>
          <button
            onClick={() => closeVisit.mutate()}
            disabled={closeVisit.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {closeVisit.isPending ? 'Закрытие…' : 'Завершить приём'}
          </button>
        </div>
      )}

      {closeVisit.isError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {(closeVisit.error as any)?.response?.data?.message ?? 'Не удалось закрыть визит'}
        </div>
      )}
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:bg-gray-50 disabled:text-gray-600';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
