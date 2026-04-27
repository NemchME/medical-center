import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Stethoscope, Building2, Clock, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { appointmentsApi } from '@/api/appointments';
import { doctorsApi } from '@/api/doctors';
import { centersApi } from '@/api/centers';
import { servicesApi } from '@/api/services';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function BookAppointmentModal({ isOpen, onClose }: BookAppointmentModalProps) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const patientId = user?.patient?.id ? Number(user.patient.id) : undefined;

  const [centerId, setCenterId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [serviceIds, setServiceIds] = useState<number[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setCenterId('');
      setDoctorId('');
      setDate('');
      setTime('');
      setDuration('30');
      setServiceIds([]);
    }
  }, [isOpen]);

  const { data: centers = [] } = useQuery({
    queryKey: ['centers'],
    queryFn: () => centersApi.list(),
    enabled: isOpen,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors', centerId ? Number(centerId) : null],
    queryFn: () => doctorsApi.list(centerId ? Number(centerId) : undefined),
    enabled: isOpen,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.listServices(),
    enabled: isOpen,
  });

  const selectedDoctor = useMemo(
    () => doctors.find((d) => String(d.id) === doctorId),
    [doctors, doctorId],
  );

  const workingDays = useMemo(() => {
    if (!selectedDoctor?.schedules) return new Set<number>();
    return new Set(selectedDoctor.schedules.map((s) => s.dayOfWeek));
  }, [selectedDoctor]);

  const dayOfWeek = date ? (new Date(date).getDay() + 6) % 7 : null;
  const dateValid = dayOfWeek === null || workingDays.size === 0 || workingDays.has(dayOfWeek);

  const mutation = useMutation({
    mutationFn: () => {
      if (!patientId) throw new Error('Не удалось определить пациента');
      const startAt = new Date(`${date}T${time}:00`).toISOString();
      return appointmentsApi.create({
        patientId,
        doctorId: Number(doctorId),
        centerId: Number(centerId),
        startAt,
        durationMin: Number(duration),
        sourceChannel: 'web',
        serviceIds: serviceIds.length ? serviceIds : undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateValid) return;
    mutation.mutate();
  };

  const errorMsg =
    (mutation.error as any)?.response?.data?.message ?? (mutation.error as any)?.message;

  if (!patientId) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Запись на приём">
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-900">
          <AlertCircle className="inline-block w-4 h-4 mr-1" />
          Ваш аккаунт не привязан к карточке пациента. Обратитесь к администратору.
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Запись на приём" size="lg">
      <form onSubmit={submit} className="space-y-4">

        <Field label="Клинический центр" icon={Building2} required>
          <select
            value={centerId}
            onChange={(e) => {
              setCenterId(e.target.value);
              setDoctorId('');
            }}
            required
            className={inputCls}
          >
            <option value="">Выберите центр</option>
            {centers.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Врач" icon={Stethoscope} required>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            required
            disabled={!centerId}
            className={inputCls}
          >
            <option value="">
              {centerId ? 'Выберите врача' : 'Сначала выберите центр'}
            </option>
            {doctors.map((d) => (
              <option key={String(d.id)} value={String(d.id)}>
                {d.fullName} {d.specialization ? `— ${d.specialization}` : ''}
              </option>
            ))}
          </select>

          {selectedDoctor?.schedules && selectedDoctor.schedules.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              <span className="text-gray-600">Рабочие дни:</span>{' '}
              {[...workingDays]
                .sort()
                .map((d) => DAY_NAMES[d])
                .join(', ')}
            </div>
          )}
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Дата" icon={Calendar} required>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              required
              className={inputCls}
            />
          </Field>
          <Field label="Время" icon={Clock} required>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className={inputCls}
            />
          </Field>
          <Field label="Длительность">
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={inputCls}
            >
              <option value="15">15 мин</option>
              <option value="30">30 мин</option>
              <option value="45">45 мин</option>
              <option value="60">60 мин</option>
              <option value="90">90 мин</option>
            </select>
          </Field>
        </div>

        {!dateValid && date && doctorId && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Врач не работает в этот день. Выберите другую дату.
          </div>
        )}

        {services.length > 0 && (
          <Field label="Услуги (необязательно)">
            <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 p-2 space-y-1">
              {services.map((s) => (
                <label
                  key={String(s.id)}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-purple-50 rounded cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={serviceIds.includes(Number(s.id))}
                    onChange={(e) => {
                      const id = Number(s.id);
                      if (e.target.checked) setServiceIds((p) => [...p, id]);
                      else setServiceIds((p) => p.filter((x) => x !== id));
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="flex-1">{s.name}</span>
                  {s.prices?.[0] && (
                    <span className="text-xs text-gray-500">
                      {Number(s.prices[0].price).toLocaleString('ru-RU')} ₽
                    </span>
                  )}
                </label>
              ))}
            </div>
          </Field>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            Ошибка: {errorMsg}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !dateValid}
            className={cn(
              'rounded-xl px-5 py-2.5 text-sm font-medium text-white',
              'bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {mutation.isPending ? 'Создание…' : 'Записаться'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const inputCls =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:bg-gray-50';

function Field({
  label,
  icon: Icon,
  children,
  required,
}: {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {Icon && <Icon className="w-4 h-4 text-purple-500" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
