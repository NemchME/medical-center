import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Building2,
  Heart,
  Clock,
  Stethoscope,
  Monitor,
  CalendarCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { doctorsApi } from '@/api/doctors';
import { centersApi } from '@/api/centers';
import DoctorCard from '@/components/shared/DoctorCard';
import CenterCard from '@/components/shared/CenterCard';
import { useAuthStore, useCurrentRole, type AppRole } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const dashboardHomeByRole: Record<AppRole, string> = {
  patient: '/patient/appointments',
  doctor: '/doctor/schedule',
  admin: '/admin/patients',
  manager: '/admin/patients',
};

const stats = [
  { icon: Users, value: '50+', label: 'врачей' },
  { icon: Building2, value: '3', label: 'центра' },
  { icon: Heart, value: '10 000+', label: 'пациентов' },
  { icon: Clock, value: '24/7', label: 'онлайн-запись' },
];

const features = [
  {
    icon: Stethoscope,
    title: 'Опытные врачи',
    desc: 'Более 50 специалистов с многолетним стажем и высшей квалификационной категорией. Постоянное повышение квалификации и обмен опытом.',
  },
  {
    icon: Monitor,
    title: 'Современное оборудование',
    desc: 'Диагностика и лечение на оборудовании экспертного класса. Точные результаты анализов и исследований.',
  },
  {
    icon: CalendarCheck,
    title: 'Онлайн-запись',
    desc: 'Запишитесь на приём в пару кликов. Выбирайте удобное время, врача и клинику не выходя из дома.',
  },
];

export function HomePage() {
  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.list(),
  });
  const { data: centers = [] } = useQuery({
    queryKey: ['centers'],
    queryFn: () => centersApi.list(),
  });
  const topDoctors = doctors.slice(0, 3);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useCurrentRole();
  const dashboardLink = dashboardHomeByRole[role];

  // Для залогиненного — ведём в кабинет; для гостя — на регистрацию
  const primaryCtaLink = isAuthenticated ? dashboardLink : '/register';
  const primaryCtaLabel = isAuthenticated ? 'Перейти в кабинет' : 'Записаться на приём';

  return (
    <>
      <section className="relative bg-cosmic overflow-hidden min-h-screen">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-primary-400/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary-600/5 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 pt-28 pb-32 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-primary-200 text-sm font-medium px-4 py-2 rounded-full mb-8 border border-white/10">
            <Sparkles className="w-4 h-4" />
            Сеть медицинских центров в Воронеже
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
            Современная медицина
            <br />
            <span className="bg-gradient-to-r from-primary-300 via-primary-400 to-accent-light bg-clip-text text-transparent">
              для каждого
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            Запишитесь на приём к лучшим специалистам онлайн. Быстро, удобно, без очередей.
            Три медицинских центра в вашем городе.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={primaryCtaLink}
              className={cn(
                'inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold',
                'bg-primary-500 hover:bg-primary-400 text-white',
                'shadow-lg shadow-primary-500/30 hover:shadow-primary-400/40',
                'transform hover:-translate-y-0.5 transition-all duration-300',
              )}
            >
              {primaryCtaLabel}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/doctors"
              className={cn(
                'inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold',
                'bg-white/10 hover:bg-white/20 text-white border border-white/20',
                'backdrop-blur-sm transition-all duration-300',
              )}
            >
              Наши врачи
            </Link>
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 -mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  'bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center',
                  'hover:bg-white/15 transition-all duration-300',
                )}
              >
                <stat.icon className="w-8 h-8 text-primary-300 mx-auto mb-3" />
                <div className="text-3xl font-extrabold text-white">{stat.value}</div>
                <div className="text-sm text-white/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="pt-32 pb-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Почему выбирают нас
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Мы объединяем лучших специалистов, современные технологии и заботу о каждом пациенте
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((item) => (
              <div
                key={item.title}
                className={cn(
                  'group bg-white p-8 rounded-2xl border border-gray-100 shadow-sm',
                  'hover:shadow-xl hover:shadow-primary-500/10 hover:-translate-y-1 transition-all duration-300',
                )}
              >
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                  <item.icon className="w-7 h-7 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-6">{item.title}</h3>
                <p className="text-gray-500 mt-3 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Наши врачи</h2>
              <p className="mt-3 text-lg text-gray-500">Лучшие специалисты города</p>
            </div>
            <Link
              to="/doctors"
              className="hidden sm:inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-500 font-semibold transition-colors"
            >
              Все врачи
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topDoctors.map((doctor) => (
              <DoctorCard key={String(doctor.id)} doctor={doctor} />
            ))}
          </div>

          <Link
            to="/doctors"
            className="sm:hidden mt-8 inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-500 font-semibold transition-colors"
          >
            Все врачи
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Наши центры</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Три современных медицинских центра в удобных районах города
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {centers.map((center) => (
              <CenterCard key={String(center.id)} center={center} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cosmic py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            {isAuthenticated
              ? 'Готовы записаться на приём?'
              : 'Начните заботиться о здоровье сегодня'}
          </h2>
          <p className="mt-4 text-lg text-white/60 max-w-xl mx-auto">
            {isAuthenticated
              ? 'Перейдите в личный кабинет — все ваши записи, рецепты и результаты в одном месте.'
              : 'Зарегистрируйтесь и запишитесь на приём к нужному специалисту за пару минут'}
          </p>
          <Link
            to={isAuthenticated ? dashboardLink : '/register'}
            className={cn(
              'mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold',
              'bg-white text-primary-600 hover:bg-primary-50',
              'shadow-lg shadow-black/20 hover:shadow-black/30',
              'transform hover:-translate-y-0.5 transition-all duration-300',
            )}
          >
            {isAuthenticated ? 'Перейти в кабинет' : 'Создать аккаунт'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
