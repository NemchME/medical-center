import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Users, Calendar, Phone, Mail, MapPin, User } from 'lucide-react';
import { USE_MOCK, MOCK_PATIENTS, MOCK_APPOINTMENTS } from '@/data/mock';
import type { Patient, Appointment } from '@/data/mock';
import DataTable from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';

export function AdminPatientsPage() {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const patients = USE_MOCK ? MOCK_PATIENTS : [];
  const appointments = USE_MOCK ? MOCK_APPOINTMENTS : [];

  const appointmentCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    appointments.forEach((a) => {
      counts[a.patientId] = (counts[a.patientId] || 0) + 1;
    });
    return counts;
  }, [appointments]);

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.email.toLowerCase().includes(q),
    );
  }, [patients, search]);

  const tableData = useMemo(
    () =>
      filtered.map((p) => ({
        ...p,
        appointmentCount: appointmentCounts[p.id] || 0,
      })),
    [filtered, appointmentCounts],
  );

  const patientAppointments = useMemo(() => {
    if (!selectedPatient) return [];
    return appointments
      .filter((a) => a.patientId === selectedPatient.id)
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [selectedPatient, appointments]);

  type PatientRow = (typeof tableData)[number];

  const columns: Column<PatientRow>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      width: '70px',
      render: (row) => (
        <span className="font-mono text-xs text-gray-500">#{row.id}</span>
      ),
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
      render: (row) => format(new Date(row.birthDate), 'd MMM yyyy', { locale: ru }),
    },
    {
      key: 'phone',
      header: 'Телефон',
      render: (row) => <span className="whitespace-nowrap">{row.phone}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => (
        <span className="text-purple-600 hover:underline">{row.email}</span>
      ),
    },
    {
      key: 'appointmentCount',
      header: 'Записей',
      sortable: true,
      width: '100px',
      render: (row) => (
        <span className="inline-flex items-center justify-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
          {row.appointmentCount}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-100 p-2.5">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Пациенты</h2>
            <p className="text-sm text-gray-500">
              Всего: {patients.length} пациентов
            </p>
          </div>
        </div>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Поиск по имени, телефону или email..."
        className="max-w-md"
      />

      <DataTable
        data={tableData as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        onRowClick={(row) => {
          const patient = patients.find((p) => p.id === (row as unknown as PatientRow).id);
          if (patient) setSelectedPatient(patient);
        }}
        emptyMessage="Пациенты не найдены"
      />

      <Modal
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
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
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedPatient.fullName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    ID: #{selectedPatient.id} &middot;{' '}
                    {selectedPatient.gender === 'male' ? 'Мужской' : 'Женский'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Дата рождения</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(selectedPatient.birthDate), 'd MMMM yyyy', {
                      locale: ru,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Телефон</p>
                  <p className="font-medium text-gray-900">{selectedPatient.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{selectedPatient.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Адрес</p>
                  <p className="font-medium text-gray-900">{selectedPatient.address}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-600">
                Записи на приём ({patientAppointments.length})
              </h4>
              {patientAppointments.length === 0 ? (
                <p className="text-sm text-gray-400">Нет записей</p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {patientAppointments.map((appt: Appointment) => (
                    <div
                      key={appt.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {appt.doctor.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(appt.startAt), 'd MMM yyyy, HH:mm', {
                            locale: ru,
                          })}{' '}
                          &middot; {appt.durationMin} мин &middot;{' '}
                          {appt.center.name}
                        </p>
                      </div>
                      <StatusBadge status={appt.status} />
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
