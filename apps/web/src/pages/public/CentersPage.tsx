import { Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { centersApi } from '@/api/centers';
import CenterCard from '@/components/shared/CenterCard';

export function CentersPage() {
  const { data: centers = [], isLoading } = useQuery({
    queryKey: ['centers'],
    queryFn: () => centersApi.list(),
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      <section className="bg-cosmic py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-primary-200 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/10">
            <Building2 className="w-4 h-4" />
            {centers.length} центра
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">О центрах</h1>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            Современные медицинские центры в удобных районах
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Загрузка…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {centers.map((center) => (
              <CenterCard key={String(center.id)} center={center} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
