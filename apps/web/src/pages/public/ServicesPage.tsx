import { ClipboardList } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { servicesApi } from '@/api/services';
import ServiceCard from '@/components/shared/ServiceCard';

export function ServicesPage() {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.listServices(),
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      <section className="bg-cosmic py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-primary-200 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/10">
            <ClipboardList className="w-4 h-4" />
            {services.length} услуг
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Услуги и цены</h1>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            Полный перечень медицинских услуг с актуальными ценами
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Загрузка…</div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Услуги пока не добавлены</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <ServiceCard key={String(service.id)} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
