import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  Pill,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import NoShowIndicator from '@/components/shared/NoShowIndicator';
import type { Appointment } from '@/types';

interface AppointmentCardProps {
  appointment: Appointment;
  className?: string;
  expandable?: boolean;
  showPrediction?: boolean;
}

export function AppointmentCard({
  appointment,
  className,
  expandable = false,
  showPrediction = false,
}: AppointmentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasVisit = !!appointment.visit;
  const canExpand = expandable && hasVisit;

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-start justify-between gap-4 p-5',
          canExpand && 'cursor-pointer',
        )}
        onClick={canExpand ? () => setExpanded((v) => !v) : undefined}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900">
              {appointment.doctor?.fullName ?? '—'}
            </h3>
            <StatusBadge status={appointment.status} />
            {showPrediction && appointment.prediction && (
              <NoShowIndicator probability={appointment.prediction.noShowProbability} />
            )}
          </div>

          {appointment.doctor?.specialization && (
            <p className="mt-1 text-sm text-purple-600 font-medium">
              {appointment.doctor.specialization}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>
                {format(new Date(appointment.startAt), 'd MMMM yyyy', {
                  locale: ru,
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>
                {format(new Date(appointment.startAt), 'HH:mm', {
                  locale: ru,
                })}{' '}
                &middot; {appointment.durationMin} мин
              </span>
            </div>
            {appointment.center?.name && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="line-clamp-1">{appointment.center.name}</span>
              </div>
            )}
          </div>
        </div>

        {canExpand && (
          <button className="mt-1 shrink-0 rounded-lg p-1 text-gray-400 hover:bg-purple-50 hover:text-purple-600 transition-colors">
            {expanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {expanded && appointment.visit && (
        <div className="border-t border-gray-100 bg-purple-50/30 px-5 py-4 rounded-b-2xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="h-4 w-4 text-purple-500" />
                Жалобы
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {appointment.visit.complaints}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="h-4 w-4 text-purple-500" />
                Диагноз
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {appointment.visit.diagnosis}
              </p>
            </div>

            {appointment.visit.examination && (
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="h-4 w-4 text-purple-500" />
                  Осмотр
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {appointment.visit.examination}
                </p>
              </div>
            )}

            {appointment.visit.notes && (
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500 italic">
                  {appointment.visit.notes}
                </p>
              </div>
            )}
          </div>

          {(appointment.visit.prescriptions?.length ?? 0) > 0 && (
            <div className="mt-4 border-t border-gray-200/60 pt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Pill className="h-4 w-4 text-purple-500" />
                Назначения
              </div>
              <div className="space-y-2">
                {appointment.visit.prescriptions!.map((rx) => (
                  <div
                    key={rx.id}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm border border-gray-100"
                  >
                    <span className="text-gray-700">{rx.text}</span>
                    <StatusBadge status={rx.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
