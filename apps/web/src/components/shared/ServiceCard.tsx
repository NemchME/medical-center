import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import type { Service } from '@/types';

interface ServiceCardProps {
  service: Service;
  className?: string;
}

export default function ServiceCard({ service, className }: ServiceCardProps) {
  const prices = service.prices ?? [];
  const minPrice = prices.length
    ? Math.min(...prices.map((p) => Number(p.price)))
    : null;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="flex">
        <div className="w-1 flex-shrink-0 bg-gradient-to-b from-purple-500 to-violet-600" />

        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {service.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">{service.description}</p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
              <Clock className="h-3.5 w-3.5" />
              {service.durationMinDefault} мин
            </div>

            {minPrice != null && (
              <span className="text-base font-bold text-gray-900">
                {minPrice.toLocaleString('ru-RU')} &#8381;
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
