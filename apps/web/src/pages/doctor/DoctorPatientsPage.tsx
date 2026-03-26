import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Users } from 'lucide-react';
import {
  USE_MOCK,
  MOCK_APPOINTMENTS,
  MOCK_PATIENTS,
  type Patient,
  type Appointment,
} from '@/data/mock';
import StatCard from '@/components/ui/StatCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';

const CURRENT_DOCTOR_ID = 1;

interface PatientRow extends Record<string, unknown> {
  id: number;
  fullName: string;
  birthDate: string;
  phone: string;
  email: string;
  lastVisit: string | null;
}

function getDoctorPatients(): PatientRow[] {
  if (!USE_MOCK) return [];

  const doctorAppointments = MOCK_APPOINTMENTS.filter(
    (a) => a.doctorId === CURRENT_DOCTOR_ID,
  );

  const patientIds = [...new Set(doctorAppointments.map((a) => a.patientId))];

  return patientIds
    .map((pid) => {
      const patient = MOCK_PATIENTS.find((p) => p.id === pid);
      if (!patient) return null;

      const patientAppointments = doctorAppointments
        .filter((a) => a.patientId === pid && a.status === 'completed')
        .sort(
          (a, b) =>
            new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
        );

      const lastVisit =
        patientAppointments.length > 0
          ? patientAppointments[0].startAt
          : null;

      return {
        id: patient.id,
        fullName: patient.fullName,
        birthDate: patient.birthDate,
        phone: patient.phone,
        email: patient.email,
        lastVisit,
      } as PatientRow;
    })
    .filter(Boolean) as PatientRow[];
}

const columns: Column<PatientRow>[] = [
  {
    key: 'fullName',
    header: 'ФИО',
    sortable: true,
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">
          {row.fullName.charAt(0)}
        </div>
        <span className="font-medium text-gray-900">{row.fullName}</span>
      </div>
    ),
  },
  {
    key: 'birthDate',
    header: 'Дата рождения',
    sortable: true,
    render: (row) =>
      format(new Date(row.birthDate), 'd MMMM yyyy', { locale: ru }),
  },
  {
    key: 'phone',
    header: 'Телефон',
    render: (row) => (
      <span className="text-gray-600">{row.phone}</span>
    ),
  },
  {
    key: 'email',
    header: 'Email',
    render: (row) => (
      <a
        href={`mailto:${row.email}`}
        className="text-purple-600 hover:text-purple-800 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {row.email}
      </a>
    ),
  },
  {
    key: 'lastVisit',
    header: 'Последний визит',
    sortable: true,
    render: (row) =>
      row.lastVisit ? (
        <span className="text-gray-700">
          {format(new Date(row.lastVisit as string), 'd MMM yyyy', {
            locale: ru,
          })}
        </span>
      ) : (
        <span className="text-gray-400">Нет визитов</span>
      ),
  },
];

export function DoctorPatientsPage() {
  const [search, setSearch] = useState('');

  const allPatients = useMemo(() => getDoctorPatients(), []);

  const filteredPatients = useMemo(() => {
    if (!search.trim()) return allPatients;
    const q = search.toLowerCase();
    return allPatients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.email.toLowerCase().includes(q),
    );
  }, [allPatients, search]);

  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(
    null,
  );

  const patientAppointments = useMemo(() => {
    if (!selectedPatient) return [];
    return MOCK_APPOINTMENTS.filter(
      (a) =>
        a.patientId === selectedPatient.id &&
        a.doctorId === CURRENT_DOCTOR_ID,
    ).sort(
      (a, b) =>
        new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
    );
  }, [selectedPatient]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Мои пациенты</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          value={allPatients.length}
          label="Всего пациентов"
        />
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Поиск по ФИО, телефону или email..."
        className="max-w-md"
      />

      <DataTable
        data={filteredPatients}
        columns={columns}
        onRowClick={(row) => setSelectedPatient(row)}
        emptyMessage="Пациенты не найдены"
      />

      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30 backdrop-blur-sm">
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Карточка пациента
              </h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6 rounded-xl bg-purple-50 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-200 text-xl font-bold text-purple-700">
                  {selectedPatient.fullName.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedPatient.fullName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(
                      new Date(selectedPatient.birthDate),
                      'd MMMM yyyy',
                      { locale: ru },
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="mb-6 space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Контактные данные
              </h4>
              <div className="space-y-2 rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Телефон</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedPatient.phone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="text-sm font-medium text-purple-600">
                    {selectedPatient.email}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                История приёмов
              </h4>
              {patientAppointments.length === 0 ? (
                <p className="rounded-xl border border-gray-200 p-4 text-center text-sm text-gray-400">
                  Нет приёмов
                </p>
              ) : (
                <div className="space-y-2">
                  {patientAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {format(
                            new Date(apt.startAt),
                            'd MMM yyyy, HH:mm',
                            { locale: ru },
                          )}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                            apt.status === 'completed'
                              ? 'border-green-300 bg-green-100 text-green-800'
                              : apt.status === 'confirmed'
                                ? 'border-blue-300 bg-blue-100 text-blue-800'
                                : apt.status === 'pending'
                                  ? 'border-yellow-300 bg-yellow-100 text-yellow-800'
                                  : apt.status === 'no_show'
                                    ? 'border-red-300 bg-red-100 text-red-800'
                                    : 'border-gray-300 bg-gray-100 text-gray-800'
                          }`}
                        >
                          {apt.status === 'completed'
                            ? 'Завершён'
                            : apt.status === 'confirmed'
                              ? 'Подтверждён'
                              : apt.status === 'pending'
                                ? 'Ожидает'
                                : apt.status === 'no_show'
                                  ? 'Неявка'
                                  : apt.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {apt.durationMin} мин
                      </p>
                      {apt.visit && (
                        <div className="mt-2 rounded-lg bg-green-50 p-2 text-sm text-green-800">
                          <p>
                            <span className="font-medium">Диагноз:</span>{' '}
                            {apt.visit.diagnosis}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
