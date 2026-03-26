import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Stethoscope,
  GraduationCap,
  MapPin,
  Calendar,
  Clock,
  X,
} from 'lucide-react';
import { USE_MOCK, MOCK_DOCTORS, MOCK_APPOINTMENTS } from '@/data/mock';
import type { Doctor, Appointment } from '@/data/mock';
import DataTable from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function AdminDoctorsPage() {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const doctors = USE_MOCK ? MOCK_DOCTORS : [];
  const appointments = USE_MOCK ? MOCK_APPOINTMENTS : [];

  const appointmentCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    appointments.forEach((a) => {
      counts[a.doctorId] = (counts[a.doctorId] || 0) + 1;
    });
    return counts;
  }, [appointments]);

  const tableData = useMemo(
    () =>
      doctors.map((d) => ({
        ...d,
        appointmentCount: appointmentCounts[d.id] || 0,
      })),
    [doctors, appointmentCounts],
  );

  const doctorAppointments = useMemo(() => {
    if (!selectedDoctor) return [];
    return appointments
      .filter((a) => a.doctorId === selectedDoctor.id)
      .sort(
        (a, b) =>
          new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
      );
  }, [selectedDoctor, appointments]);

  type DoctorRow = (typeof tableData)[number];

  const columns: Column<DoctorRow>[] = [
    {
      key: 'fullName',
      header: 'ФИО',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.photoUrl}
            alt={row.fullName}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-purple-100"
          />
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
          {row.specialization}
        </span>
      ),
    },
    {
      key: 'centerName',
      header: 'Центр',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.center.name}</span>
      ),
    },
    {
      key: 'experience',
      header: 'Стаж',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-700">{row.experience}</span>
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-purple-100 p-2.5">
          <Stethoscope className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Врачи</h2>
          <p className="text-sm text-gray-500">
            Всего: {doctors.length} специалистов
          </p>
        </div>
      </div>

      <DataTable
        data={tableData as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        onRowClick={(row) => {
          const doctor = doctors.find(
            (d) => d.id === (row as unknown as DoctorRow).id,
          );
          if (doctor) setSelectedDoctor(doctor);
        }}
        emptyMessage="Нет данных о врачах"
      />

      <Modal
        isOpen={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        title="Информация о враче"
        size="lg"
      >
        {selectedDoctor && (
          <div className="space-y-6">
            <div className="flex items-start gap-5 rounded-xl bg-purple-50/50 p-4">
              <img
                src={selectedDoctor.photoUrl}
                alt={selectedDoctor.fullName}
                className="h-20 w-20 rounded-2xl object-cover ring-2 ring-purple-200 shadow-sm"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDoctor.fullName}
                </h3>
                <span className="mt-1 inline-flex items-center rounded-full bg-purple-100 px-3 py-0.5 text-sm font-medium text-purple-700">
                  {selectedDoctor.specialization}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {selectedDoctor.bio}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Образование</p>
                  <p className="font-medium text-gray-900">
                    {selectedDoctor.education}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Стаж</p>
                  <p className="font-medium text-gray-900">
                    {selectedDoctor.experience}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Центр</p>
                  <p className="font-medium text-gray-900">
                    {selectedDoctor.center.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Записей всего</p>
                  <p className="font-medium text-gray-900">
                    {appointmentCounts[selectedDoctor.id] || 0}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-600">
                Расписание
              </h4>
              {selectedDoctor.schedules.length === 0 ? (
                <p className="text-sm text-gray-400">Расписание не задано</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {selectedDoctor.schedules.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {DAY_NAMES[s.dayOfWeek]}
                      </span>
                      <span className="text-sm text-gray-600">
                        {s.startTime} -- {s.endTime}
                      </span>
                      <span className="text-xs text-gray-400">
                        {s.slotMin} мин
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-600">
                Последние записи ({doctorAppointments.length})
              </h4>
              {doctorAppointments.length === 0 ? (
                <p className="text-sm text-gray-400">Нет записей</p>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {doctorAppointments.map((appt: Appointment) => (
                    <div
                      key={appt.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {appt.patient.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(appt.startAt), 'd MMM yyyy, HH:mm', {
                            locale: ru,
                          })}{' '}
                          &middot; {appt.durationMin} мин
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
