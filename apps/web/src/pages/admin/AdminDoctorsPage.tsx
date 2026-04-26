import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Stethoscope,
  GraduationCap,
  MapPin,
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  CalendarClock,
} from 'lucide-react';
import { doctorsApi } from '@/api/doctors';
import { centersApi } from '@/api/centers';
import { appointmentsApi } from '@/api/appointments';
import { authApi } from '@/api/auth';
import type { Doctor, DoctorSchedule, ID } from '@/types';
import DataTable from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import NoShowIndicator from '@/components/shared/NoShowIndicator';

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface DoctorFormState {
  email: string;
  password: string;
  centerId: string;
  fullName: string;
  specialization: string;
  photoUrl: string;
  experience: string;
  education: string;
  bio: string;
}

const emptyForm: DoctorFormState = {
  email: '',
  password: 'doctor12345',
  centerId: '',
  fullName: '',
  specialization: '',
  photoUrl: '',
  experience: '',
  education: '',
  bio: '',
};

export function AdminDoctorsPage() {
  const qc = useQueryClient();
  const [selectedDoctorId, setSelectedDoctorId] = useState<ID | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [scheduleDoctorId, setScheduleDoctorId] = useState<ID | null>(null);
  const [form, setForm] = useState<DoctorFormState>(emptyForm);

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.list(),
  });
  const { data: centers = [] } = useQuery({
    queryKey: ['centers'],
    queryFn: () => centersApi.list(),
  });

  const { data: selectedDoctor } = useQuery({
    queryKey: ['doctor', selectedDoctorId],
    queryFn: () => doctorsApi.get(selectedDoctorId!),
    enabled: !!selectedDoctorId,
  });
  const { data: doctorAppointments = [] } = useQuery({
    queryKey: ['appointments', 'by-doctor', selectedDoctorId],
    queryFn: () => appointmentsApi.list({ doctorId: selectedDoctorId! }),
    enabled: !!selectedDoctorId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const auth = await authApi.register({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        role: 'doctor',
      });
      return doctorsApi.create({
        userId: auth.user.id,
        centerId: Number(form.centerId),
        fullName: form.fullName,
        specialization: form.specialization || undefined,
        photoUrl: form.photoUrl || undefined,
        experience: form.experience || undefined,
        education: form.education || undefined,
        bio: form.bio || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      setIsCreateOpen(false);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      doctorsApi.update(editingId!, {
        centerId: Number(form.centerId) as unknown as ID,
        fullName: form.fullName,
        specialization: form.specialization || undefined,
        photoUrl: form.photoUrl || undefined,
        experience: form.experience || undefined,
        education: form.education || undefined,
        bio: form.bio || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['doctor', editingId] });
      setEditingId(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: ID) => doctorsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  });

  const openEdit = (doctor: Doctor) => {
    setForm({
      email: '',
      password: '',
      centerId: String(doctor.centerId),
      fullName: doctor.fullName,
      specialization: doctor.specialization ?? '',
      photoUrl: doctor.photoUrl ?? '',
      experience: doctor.experience ?? '',
      education: doctor.education ?? '',
      bio: doctor.bio ?? '',
    });
    setEditingId(doctor.id);
  };

  const tableData = useMemo(() => doctors, [doctors]);

  const columns: Column<Doctor>[] = [
    {
      key: 'fullName',
      header: 'ФИО',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.photoUrl ? (
            <img
              src={row.photoUrl}
              alt={row.fullName}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-purple-100"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold">
              {row.fullName.charAt(0)}
            </div>
          )}
          <span className="font-medium text-gray-900">{row.fullName}</span>
        </div>
      ),
    },
    {
      key: 'specialization',
      header: 'Специализация',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
          {row.specialization ?? '—'}
        </span>
      ),
    },
    {
      key: 'centerName',
      header: 'Центр',
      render: (row) => <span className="text-sm text-gray-600">{row.center?.name ?? '—'}</span>,
    },
    {
      key: 'experience',
      header: 'Стаж',
      render: (row) => <span className="text-sm text-gray-700">{row.experience ?? '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '160px',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setScheduleDoctorId(row.id)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-purple-50 hover:text-purple-600"
            title="Расписание"
          >
            <CalendarClock className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEdit(row)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-purple-50 hover:text-purple-600"
            title="Редактировать"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Удалить врача "${row.fullName}"?`)) deleteMutation.mutate(row.id);
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

  const modalTitle = editingId ? 'Редактировать врача' : 'Добавить врача';
  const modalOpen = isCreateOpen || editingId !== null;
  const closeModal = () => {
    setIsCreateOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMsg =
    (createMutation.error as any)?.response?.data?.message ??
    (updateMutation.error as any)?.response?.data?.message;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-100 p-2.5">
            <Stethoscope className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Врачи</h2>
            <p className="text-sm text-gray-500">Всего: {doctors.length} специалистов</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Добавить врача
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Загрузка…</div>
      ) : (
        <DataTable
          data={tableData as unknown as Record<string, unknown>[]}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          onRowClick={(row) => setSelectedDoctorId((row as unknown as Doctor).id)}
          emptyMessage="Нет данных о врачах"
        />
      )}

      {/* Create / Edit modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={modalTitle} size="lg">
        <form onSubmit={submit} className="space-y-4">
          {!editingId && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-sm text-blue-900">
              Будет создан пользователь с ролью «doctor». После создания врач сможет войти под этим
              email и паролем.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="ФИО" required>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Центр" required>
              <select
                value={form.centerId}
                onChange={(e) => setForm({ ...form, centerId: e.target.value })}
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

            {!editingId && (
              <>
                <Field label="Email (для входа)" required>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className={inputCls}
                  />
                </Field>
                <Field label="Пароль">
                  <input
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                    className={inputCls}
                  />
                </Field>
              </>
            )}

            <Field label="Специализация">
              <input
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Стаж">
              <input
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                placeholder="10 лет"
                className={inputCls}
              />
            </Field>

            <Field label="Образование" className="sm:col-span-2">
              <input
                value={form.education}
                onChange={(e) => setForm({ ...form, education: e.target.value })}
                className={inputCls}
              />
            </Field>

            <Field label="URL фото" className="sm:col-span-2">
              <input
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                placeholder="https://…"
                className={inputCls}
              />
            </Field>

            <Field label="Описание (bio)" className="sm:col-span-2">
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className={inputCls}
              />
            </Field>
          </div>

          {errorMsg && <div className="text-sm text-red-600">Ошибка: {errorMsg}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-purple-700"
            >
              {isPending ? 'Сохранение…' : editingId ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule modal */}
      {scheduleDoctorId && (
        <ScheduleEditor
          doctorId={scheduleDoctorId}
          onClose={() => setScheduleDoctorId(null)}
        />
      )}

      {/* View details modal */}
      <Modal
        isOpen={!!selectedDoctorId}
        onClose={() => setSelectedDoctorId(null)}
        title="Информация о враче"
        size="lg"
      >
        {selectedDoctor && (
          <div className="space-y-6">
            <div className="flex items-start gap-5 rounded-xl bg-purple-50/50 p-4">
              {selectedDoctor.photoUrl ? (
                <img
                  src={selectedDoctor.photoUrl}
                  alt={selectedDoctor.fullName}
                  className="h-20 w-20 rounded-2xl object-cover ring-2 ring-purple-200 shadow-sm"
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-purple-500 text-white flex items-center justify-center text-2xl font-bold ring-2 ring-purple-200 shadow-sm">
                  {selectedDoctor.fullName.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{selectedDoctor.fullName}</h3>
                {selectedDoctor.specialization && (
                  <span className="mt-1 inline-flex items-center rounded-full bg-purple-100 px-3 py-0.5 text-sm font-medium text-purple-700">
                    {selectedDoctor.specialization}
                  </span>
                )}
                {selectedDoctor.bio && (
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{selectedDoctor.bio}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {selectedDoctor.education && (
                <Info icon={GraduationCap} label="Образование" value={selectedDoctor.education} />
              )}
              {selectedDoctor.experience && (
                <Info icon={Clock} label="Стаж" value={selectedDoctor.experience} />
              )}
              {selectedDoctor.center?.name && (
                <Info icon={MapPin} label="Центр" value={selectedDoctor.center.name} />
              )}
              <Info
                icon={Calendar}
                label="Записей всего"
                value={String(doctorAppointments.length)}
              />
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-600">
                Последние записи ({doctorAppointments.length})
              </h4>
              {doctorAppointments.length === 0 ? (
                <p className="text-sm text-gray-400">Нет записей</p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {doctorAppointments.slice(0, 15).map((appt) => (
                    <div
                      key={String(appt.id)}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {appt.patient?.fullName ?? '—'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(appt.startAt), 'd MMM yyyy, HH:mm', { locale: ru })}{' '}
                          &middot; {appt.durationMin} мин
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {appt.prediction && (
                          <NoShowIndicator probability={appt.prediction.noShowProbability} />
                        )}
                        <StatusBadge status={appt.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20';

function Field({
  label,
  children,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-4 w-4 text-gray-400" />
      <div>
        <p className="text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// ─── Schedule Editor ──────────────────────────────────────────────

function ScheduleEditor({ doctorId, onClose }: { doctorId: ID; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: doctor } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => doctorsApi.get(doctorId),
  });

  const [rows, setRows] = useState<
    { dayOfWeek: number; startTime: string; endTime: string; slotMin: number; enabled: boolean }[]
  >([]);

  useEffect(() => {
    if (doctor) {
      const map = new Map<number, DoctorSchedule>();
      (doctor.schedules ?? []).forEach((s) => map.set(s.dayOfWeek, s));
      setRows(
        DAY_NAMES.map((_, i) => {
          const s = map.get(i);
          return {
            dayOfWeek: i,
            startTime: s?.startTime ?? '09:00',
            endTime: s?.endTime ?? '17:00',
            slotMin: s?.slotMin ?? 30,
            enabled: !!s,
          };
        }),
      );
    }
  }, [doctor]);

  const saveMutation = useMutation({
    mutationFn: () =>
      doctorsApi.bulkSetSchedule(
        doctorId,
        rows
          .filter((r) => r.enabled)
          .map((r) => ({
            dayOfWeek: r.dayOfWeek,
            startTime: r.startTime,
            endTime: r.endTime,
            slotMin: r.slotMin,
          })),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', doctorId] });
      qc.invalidateQueries({ queryKey: ['doctors'] });
      onClose();
    },
  });

  return (
    <Modal isOpen={true} onClose={onClose} title="Расписание врача" size="lg">
      {!doctor ? (
        <div className="text-center py-12 text-gray-500">Загрузка…</div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-500">
            Рабочее расписание: {doctor.fullName}
          </div>

          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div
                key={row.dayOfWeek}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  row.enabled ? 'border-purple-200 bg-purple-50/50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <label className="flex items-center gap-2 w-28 flex-shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) => {
                      const copy = [...rows];
                      copy[idx] = { ...row, enabled: e.target.checked };
                      setRows(copy);
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">{DAY_NAMES[row.dayOfWeek]}</span>
                </label>
                <input
                  type="time"
                  value={row.startTime}
                  onChange={(e) => {
                    const copy = [...rows];
                    copy[idx] = { ...row, startTime: e.target.value };
                    setRows(copy);
                  }}
                  disabled={!row.enabled}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="time"
                  value={row.endTime}
                  onChange={(e) => {
                    const copy = [...rows];
                    copy[idx] = { ...row, endTime: e.target.value };
                    setRows(copy);
                  }}
                  disabled={!row.enabled}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
                />
                <select
                  value={row.slotMin}
                  onChange={(e) => {
                    const copy = [...rows];
                    copy[idx] = { ...row, slotMin: Number(e.target.value) };
                    setRows(copy);
                  }}
                  disabled={!row.enabled}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  <option value={15}>15 мин</option>
                  <option value={30}>30 мин</option>
                  <option value={45}>45 мин</option>
                  <option value={60}>60 мин</option>
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-purple-700"
            >
              {saveMutation.isPending ? 'Сохранение…' : 'Сохранить расписание'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
