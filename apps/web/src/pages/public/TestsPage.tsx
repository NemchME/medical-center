import { FlaskConical } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { servicesApi } from '@/api/services';
import TestCard from '@/components/shared/TestCard';

export function TestsPage() {
  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['lab-tests'],
    queryFn: () => servicesApi.listTests(),
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      <section className="bg-cosmic py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-primary-200 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/10">
            <FlaskConical className="w-4 h-4" />
            {tests.length} анализов
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Анализы</h1>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            Лабораторные исследования с быстрыми и точными результатами
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Загрузка…</div>
        ) : tests.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Анализы пока не добавлены</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <TestCard key={String(test.id)} test={test} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
