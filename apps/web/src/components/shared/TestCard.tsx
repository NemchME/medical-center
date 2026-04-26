import { cn } from '@/lib/utils';
import { TestTube, AlertCircle } from 'lucide-react';
import type { LabTest } from '@/types';

interface TestCardProps {
  test: LabTest;
  className?: string;
}

export default function TestCard({ test, className }: TestCardProps) {
  const prices = test.prices ?? [];
  const minPrice = prices.length
    ? Math.min(...prices.map((p) => Number(p.price)))
    : null;

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">{test.name}</h3>
        {minPrice != null && (
          <span className="flex-shrink-0 text-base font-bold text-gray-900">
            {minPrice.toLocaleString('ru-RU')} &#8381;
          </span>
        )}
      </div>

      {test.description && (
        <p className="mt-1.5 text-sm text-gray-500">{test.description}</p>
      )}

      {test.sampleType && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
            <TestTube className="h-3.5 w-3.5" />
            {test.sampleType}
          </span>
        </div>
      )}

      {test.preparation && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>{test.preparation}</span>
        </div>
      )}
    </div>
  );
}
