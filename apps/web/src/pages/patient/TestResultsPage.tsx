import { useMemo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { FlaskConical, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { testResultsApi } from '@/api/test-results';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

function isOutOfRange(result: string, refRange?: string | null): boolean {
  if (!result || !refRange) return false;

  const numResult = parseFloat(result);
  if (isNaN(numResult)) return false;

  const ltMatch = refRange.match(/^<\s*([\d.]+)$/);
  if (ltMatch) {
    return numResult >= parseFloat(ltMatch[1]);
  }

  const gtMatch = refRange.match(/^>\s*([\d.]+)$/);
  if (gtMatch) {
    return numResult <= parseFloat(gtMatch[1]);
  }

  const rangeMatch = refRange.match(/^([\d.]+)\s*[-\u2013]\s*([\d.]+)$/);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    return numResult < low || numResult > high;
  }

  return false;
}

export function TestResultsPage() {
  const { data: raw = [], isLoading } = useQuery({
    queryKey: ['test-results', 'mine'],
    queryFn: () => testResultsApi.mine(),
  });
  const testResults = useMemo(
    () =>
      [...raw].sort(
        (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime(),
      ),
    [raw],
  );

  if (isLoading) {
    return <div className="text-gray-500 text-center py-12">Загрузка…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Результаты анализов
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Лабораторные исследования и их результаты
        </p>
      </div>

      {testResults.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="Нет результатов анализов"
          description="Результаты лабораторных исследований появятся здесь"
        />
      ) : (
        <div className="space-y-4">
          {testResults.map((tr) => {
            const isPending = tr.status === 'pending';
            const outOfRange =
              !isPending && isOutOfRange(tr.result, tr.refRange);

            return (
              <div
                key={String(tr.id)}
                className={cn(
                  'rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md',
                  outOfRange
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-gray-100',
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900">
                        {tr.test?.name ?? '—'}
                      </h3>
                      {isPending ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-300 bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          В процессе
                        </span>
                      ) : (
                        <StatusBadge status={tr.status} />
                      )}
                    </div>

                    {tr.test?.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {tr.test.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <span className="text-gray-500">
                        Сдан:{' '}
                        <span className="text-gray-700 font-medium">
                          {format(new Date(tr.takenAt), 'd MMM yyyy', {
                            locale: ru,
                          })}
                        </span>
                      </span>
                      {tr.readyAt && (
                        <span className="text-gray-500">
                          Готов:{' '}
                          <span className="text-gray-700 font-medium">
                            {format(new Date(tr.readyAt), 'd MMM yyyy', {
                              locale: ru,
                            })}
                          </span>
                        </span>
                      )}
                      {tr.test?.sampleType && (
                        <span className="text-gray-500">
                          Биоматериал:{' '}
                          <span className="text-gray-700">{tr.test.sampleType}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    {isPending ? (
                      <div className="flex items-center gap-2 sm:justify-end">
                        <div className="h-6 w-20 rounded-lg bg-gray-200 animate-pulse" />
                      </div>
                    ) : (
                      <>
                        <div
                          className={cn(
                            'text-2xl font-bold',
                            outOfRange ? 'text-red-600' : 'text-gray-900',
                          )}
                        >
                          {tr.result}{' '}
                          <span className="text-sm font-normal text-gray-500">
                            {tr.unit}
                          </span>
                        </div>
                        <div
                          className={cn(
                            'mt-1 text-sm flex items-center gap-1 sm:justify-end',
                            outOfRange ? 'text-red-500' : 'text-gray-400',
                          )}
                        >
                          {outOfRange && (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          )}
                          <span>Норма: {tr.refRange} {tr.unit}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
