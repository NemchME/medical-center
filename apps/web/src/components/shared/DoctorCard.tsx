import { cn } from '@/lib/utils';
import { Briefcase, GraduationCap, Building2 } from 'lucide-react';
import type { Doctor } from '@/data/mock';

interface DoctorCardProps {
  doctor: Doctor;
  className?: string;
}

export default function DoctorCard({ doctor, className }: DoctorCardProps) {
  return (
    <div
      className={cn(
        'group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg',
        className,
      )}
    >
      <div className="h-1.5 bg-gradient-to-r from-purple-500 to-violet-600" />

      <div className="p-5">
        <div className="flex items-start gap-4">
          <img
            src={doctor.photoUrl}
            alt={doctor.fullName}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-purple-100"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {doctor.fullName}
            </h3>
            <p className="mt-0.5 text-sm font-medium text-purple-600">
              {doctor.specialization}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Briefcase className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <span>Опыт: {doctor.experience}</span>
          </div>

          {doctor.education && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <GraduationCap className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <span className="truncate">{doctor.education}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <span className="truncate">{doctor.center.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
