import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import {
  Calendar,
  ClipboardList,
  Users,
  User,
  BarChart3,
  Stethoscope,
  FileText,
  TestTubes,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ElementType;
}

const patientLinks: SidebarLink[] = [
  { to: '/patient/profile', label: 'Профиль', icon: User },
  { to: '/patient/appointments', label: 'Мои записи', icon: ClipboardList },
  { to: '/patient/med-card', label: 'Медицинская карта', icon: FileText },
  { to: '/patient/prescriptions', label: 'Рецепты', icon: Stethoscope },
  { to: '/patient/test-results', label: 'Результаты анализов', icon: TestTubes },
];

const doctorLinks: SidebarLink[] = [
  { to: '/doctor/schedule', label: 'Расписание', icon: Calendar },
  { to: '/doctor/patients', label: 'Пациенты', icon: Users },
  { to: '/doctor/profile', label: 'Профиль', icon: User },
];

const adminLinks: SidebarLink[] = [
  { to: '/admin/patients', label: 'Пациенты', icon: Users },
  { to: '/admin/appointments', label: 'Записи на приёмы', icon: ClipboardList },
  { to: '/admin/doctors', label: 'Врачи', icon: Stethoscope },
  { to: '/admin/analytics', label: 'Аналитика', icon: BarChart3 },
];

const roleLabels = {
  patient: 'Пациент',
  doctor: 'Врач',
  admin: 'Администратор',
};

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, role, setRole } = useAuthStore();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const links = role === 'admin' ? adminLinks : role === 'doctor' ? doctorLinks : patientLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-primary-950 text-white flex flex-col fixed h-full z-20">
        <Link
          to="/"
          className="flex items-center gap-3 px-6 py-5 border-b border-white/10"
        >
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-sm font-bold">
            M
          </div>
          <span className="text-xl font-bold tracking-tight">Medecina</span>
        </Link>

        <div className="px-4 pt-4 pb-2 relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
          >
            <span className="text-white/70">{roleLabels[role]}</span>
            <ChevronDown className={cn('w-4 h-4 text-white/50 transition-transform', roleMenuOpen && 'rotate-180')} />
          </button>
          {roleMenuOpen && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-gray-800 rounded-lg shadow-xl border border-white/10 overflow-hidden z-30 animate-fade-in">
              {(['patient', 'doctor', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setRoleMenuOpen(false);
                    navigate(r === 'admin' ? '/admin/patients' : r === 'doctor' ? '/doctor/schedule' : '/patient/profile');
                  }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors',
                    role === r ? 'text-primary-400 bg-white/5' : 'text-white/70',
                  )}
                >
                  {roleLabels[r]}
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto scrollbar-thin">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5',
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName || 'Пользователь'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <main className="flex-1 p-6 overflow-auto">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
