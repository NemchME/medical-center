import { cn } from '@/lib/utils';
import { MapPin, Phone, Mail } from 'lucide-react';
import type { ClinicCenter } from '@/types';

interface CenterCardProps {
  center: ClinicCenter;
  className?: string;
}

export default function CenterCard({ center, className }: CenterCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <h3 className="text-base font-semibold text-gray-900">{center.name}</h3>

      <div className="mt-4 space-y-2.5">
        <div className="flex items-start gap-2.5 text-sm text-gray-600">
          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
          <span>{center.address}</span>
        </div>

        {center.phone && (
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <Phone className="h-4 w-4 flex-shrink-0 text-purple-500" />
            <a
              href={`tel:${center.phone.replace(/[^\d+]/g, '')}`}
              className="hover:text-purple-600 hover:underline"
            >
              {center.phone}
            </a>
          </div>
        )}

        {center.email && (
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <Mail className="h-4 w-4 flex-shrink-0 text-purple-500" />
            <a
              href={`mailto:${center.email}`}
              className="hover:text-purple-600 hover:underline"
            >
              {center.email}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
