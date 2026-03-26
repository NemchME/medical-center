import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Phone, Mail, Clock } from 'lucide-react';

const navLinks = [
  { to: '/centers', label: 'О центрах' },
  { to: '/services', label: 'Услуги и цены' },
  { to: '/doctors', label: 'Наши врачи' },
  { to: '/tests', label: 'Анализы' },
];

export function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-primary-900 text-white/70 text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> +7 (473) 200-10-01
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" /> info@medecina.ru
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Пн-Сб: 8:00 — 20:00
          </span>
        </div>
      </div>

      <header className="bg-cosmic text-white shadow-xl sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-lg font-black">
              M
            </div>
            <span className="text-2xl font-bold tracking-tight">Medecina</span>
          </Link>

          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  location.pathname === link.to
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10',
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/login"
              className="ml-4 px-5 py-2.5 bg-primary-500 hover:bg-primary-400 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg shadow-primary-500/30 hover:shadow-primary-400/40"
            >
              Войти и записаться
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-400 pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-sm font-bold text-white">
                  M
                </div>
                <span className="text-lg font-bold text-white">Medecina</span>
              </div>
              <p className="text-sm leading-relaxed">
                Современная система управления клиникой для пациентов и врачей
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Навигация</h4>
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link key={link.to} to={link.to} className="block text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Контакты</h4>
              <div className="space-y-2 text-sm">
                <p>+7 (473) 200-10-01</p>
                <p>info@medecina.ru</p>
                <p>г. Воронеж, ул. Ленина, 42</p>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Для пациентов</h4>
              <div className="space-y-2 text-sm">
                <Link to="/register" className="block hover:text-white transition-colors">Регистрация</Link>
                <Link to="/login" className="block hover:text-white transition-colors">Вход в кабинет</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
            &copy; 2026 Medecina. Курсовой проект ВГУ. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}
