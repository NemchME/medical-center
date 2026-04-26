import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { patientsApi } from '@/api/patients';
import { appointmentsApi } from '@/api/appointments';
import type { Patient, ID } from '@/types';
import DataTable from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import NoShowIndicator from '@/components/shared/NoShowIndicator';

interface PatientFormState {
  fullName: string;
  birthDate: string;
  phone: string;
  email: string;
  gender: string;
  address: string;
}

const emptyForm: PatientFormState = {
  fullName: '',
  birthDate: '',
  phone: '',
  email: '',
  gender: 'male',
  address: '',
};

export function AdminPatientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<ID | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [form, setForm] = useState<PatientFormState>(emptyForm);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: () => patientsApi.list(search || undefined),
  });

  const { data: selectedPatient } = useQuery({
    queryKey: ['patient', selectedPatientId],
    queryFn: () => patientsApi.get(selectedPatientId!),
    enabled: !!selectedPatientId,
  });
  const { data: patientAppointments = [] } = useQuery({
    queryKey: ['appointments', 'by-patient', selectedPatientId],
    queryFn: () => appointmentsApi.list({ patientId: selectedPatientId! }),
    enabled: !!selectedPatientId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      patientsApi.create({
        fullName: form.fullName,
        birthDate: form.birthDate || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        gender: form.gender || undefined,
        address: form.address || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      setIsCreateOpen(false);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      patientsApi.update(editingId!, {
        fullName: form.fullName,
        birthDate: form.birthDate || null,
        phone: form.phone || null,
        email: form.email || null,
        gender: form.gender || null,
        address: form.address || null,
      } as Partial<Patient>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      qc.invalidateQueries({ queryKey: ['patient', editingId] });
      setEditingId(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: ID) => patientsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });

  const openEdit = (p: Patient) => {
    setForm({
      fullName: p.fullName,
      birthDate: (p.birthDate ?? '').slice(0, 10),
      phone: p.phone ?? '',
      email: p.email ?? '',
      gender: p.gender ?? 'male',
      address: p.address ?? '',
    });
    setEditingId(p.id);
  };

  const tableData = useMemo(() => patients, [patients]);

  const columns: Column<Patient>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      width: '70px',
      render: (row) => <span className="font-mono text-xs text-gray-500">#{String(row.id)}</span>,
    },
    {
      key: 'fullName',
      header: 'ФИО',
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900">{row.fullName}</span>,
    },
    {
      key: 'birthDate',
      header: 'Дата рождения',
      sortable: true,
      render: (row) =>
        row.birthDate ? format(new Date(row.birthDate), 'd MMM yyyy', { locale: ru }) : '—',
    },
    {
      key: 'phone',
      header: 'Телефон',
      render: (row) => <span className="whitespace-nowrap">{row.phone ?? '—'}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => <span className="text-purple-600">{row.email ?? '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '110px',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEdit(row)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-purple-50 hover:text-purple-600"
            title="Редактировать"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Удалить пациента "${row.fullName}"?`)) deleteMutation.mutate(row.id);
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

  const modalTitle = editingId ? 'Редактировать пациента' : 'Добавить пациента';
  const modalOpen = isCreateOpen || editingId !== null;
  const closeModal = () => {
    setIsCreateOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) updateMutation.mutate();
    else createMutation.mutate();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMsg =
    (createMutation.error as any)?.response?.data?.message ??
    (updateMutation.error as any)?.response?.data?.message;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-100 p-2.5">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Пациенты</h2>
            <p className="text-sm text-gray-500">Всего: {patients.length} пациентов</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Добавить пациента
        </button>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Поиск по имени, телефону или email..."
        className="max-w-md"
      />

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Загрузка…</div>
      ) : (
        <DataTable
          data={tableData as unknown as Record<string, unknown>[]}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          onRowClick={(row) => setSelectedPatientId((row as unknown as Patient).id)}
          emptyMessage="Пациенты не найдены"
        />
      )}

      {/* Create / Edit */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={modalTitle} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="ФИО" required className="sm:col-span-2">
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                className={inputCls}
              />
            </Field>

            <Field label="Дата рождения">
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Пол">
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className={inputCls}
              >
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </Field>

            <Field label="Телефон">
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+7 (900) 123-45-67"
                className={inputCls}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
              />
            </Field>

            <Field label="Адрес" className="sm:col-span-2">
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
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

      {/* View */}
      <Modal
        isOpen={!!selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
        title="Информация о пациенте"
        size="lg"
      >
        {selectedPatient && (
          <div className="space-y-6">
            <div className="rounded-xl bg-purple-50/50 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-200">
                  <User className="h-7 w-7 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedPatient.fullName}</h3>
                  <p className="text-sm text-gray-500">
                    ID: #{String(selectedPatient.id)}
                    {selectedPatient.gender &&
                      ` · ${selectedPatient.gender === 'male' ? 'Мужской' : 'Женский'}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow icon={Calendar} label="Дата рождения" value={
                selectedPatient.birthDate
                  ? format(new Date(selectedPatient.birthDate), 'd MMMM yyyy', { locale: ru })
                  : '—'
              } />
              <InfoRow icon={Phone} label="Телефон" value={selectedPatient.phone ?? '—'} />
              <InfoRow icon={Mail} label="Email" value={selectedPatient.email ?? '—'} />
              <InfoRow icon={MapPin} label="Адрес" value={selectedPatient.address ?? '—'} />
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-600">
                Записи на приём ({patientAppointments.length})
              </h4>
              {patientAppointments.length === 0 ? (
                <p className="text-sm text-gray-400">Нет записей</p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {patientAppointments.map((appt) => (
                    <div
                      key={String(appt.id)}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {appt.doctor?.fullName ?? '—'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(appt.startAt), 'd MMM yyyy, HH:mm', { locale: ru })}{' '}
                          &middot; {appt.durationMin} мин{' '}
                          {appt.center?.name && `· ${appt.center.name}`}
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

function InfoRow({
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
