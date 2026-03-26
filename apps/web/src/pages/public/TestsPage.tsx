import { FlaskConical } from 'lucide-react';
import { MOCK_TESTS } from '@/data/mock';
import TestCard from '@/components/shared/TestCard';

export function TestsPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <section className="bg-cosmic py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-primary-200 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/10">
            <FlaskConical className="w-4 h-4" />
            {MOCK_TESTS.length} анализов
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Анализы</h1>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            Лабораторные исследования с быстрыми и точными результатами
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_TESTS.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>
      </div>
    </div>
  );
}
