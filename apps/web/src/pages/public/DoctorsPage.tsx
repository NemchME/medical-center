import { useState, useMemo } from 'react';
import { Search, Stethoscope } from 'lucide-react';
import { MOCK_DOCTORS } from '@/data/mock';
import DoctorCard from '@/components/shared/DoctorCard';
import { cn } from '@/lib/utils';

const ALL_FILTER = 'Все';

export function DoctorsPage() {
  const [activeSpec, setActiveSpec] = useState(ALL_FILTER);
  const [search, setSearch] = useState('');

  const specializations = useMemo(() => {
    const specs = Array.from(new Set(MOCK_DOCTORS.map((d) => d.specialization)));
    return [ALL_FILTER, ...specs.sort()];
  }, []);

  const filtered = useMemo(() => {
    let list = MOCK_DOCTORS;
    if (activeSpec !== ALL_FILTER) {
      list = list.filter((d) => d.specialization === activeSpec);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.fullName.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.center.name.toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeSpec, search]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <section className="bg-cosmic py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-primary-200 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/10">
            <Stethoscope className="w-4 h-4" />
            {MOCK_DOCTORS.length} специалистов
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Наши врачи</h1>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            Выберите специалиста и запишитесь на приём онлайн
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="space-y-6 mb-10">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по имени, специализации..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl',
                'text-gray-900 placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                'transition-all duration-200',
              )}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {specializations.map((spec) => (
              <button
                key={spec}
                onClick={() => setActiveSpec(spec)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  activeSpec === spec
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600',
                )}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Врачи не найдены</p>
            <p className="text-sm mt-1">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
