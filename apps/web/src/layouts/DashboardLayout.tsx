import {
  Outlet,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import {
  useAuthStore,
  useCurrentRole,
  type AppRole,
} from "@/stores/auth.store";
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
  Bell,
  Building2,
  FlaskConical,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ElementType;
}

const patientLinks: SidebarLink[] = [
  { to: "/patient/profile", label: "Профиль", icon: User },
  { to: "/patient/appointments", label: "Мои записи", icon: ClipboardList },
  { to: "/patient/med-card", label: "Медицинская карта", icon: FileText },
  { to: "/patient/prescriptions", label: "Рецепты", icon: Stethoscope },
  {
    to: "/patient/test-results",
    label: "Результаты анализов",
    icon: TestTubes,
  },
];

const doctorLinks: SidebarLink[] = [
  { to: "/doctor/schedule", label: "Расписание", icon: Calendar },
  { to: "/doctor/patients", label: "Пациенты", icon: Users },
  { to: "/doctor/profile", label: "Профиль", icon: User },
];

const adminLinks: SidebarLink[] = [
  { to: "/admin/patients", label: "Пациенты", icon: Users },
  { to: "/admin/appointments", label: "Записи на приёмы", icon: ClipboardList },
  { to: "/admin/doctors", label: "Врачи", icon: Stethoscope },
  { to: "/admin/centers", label: "Клиники", icon: Building2 },
  { to: "/admin/services", label: "Услуги и анализы", icon: FlaskConical },
  { to: "/admin/analytics", label: "Аналитика", icon: BarChart3 },
  { to: "/admin/notifications", label: "Уведомления", icon: Bell },
];

const roleLabels: Record<AppRole, string> = {
  patient: "Пациент",
  doctor: "Врач",
  admin: "Администратор",
  manager: "Менеджер",
};

function linksByRole(role: AppRole): SidebarLink[] {
  if (role === "admin" || role === "manager") return adminLinks;
  if (role === "doctor") return doctorLinks;
  return patientLinks;
}

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout, hydrate } = useAuthStore();
  const role = useCurrentRole();

  useEffect(() => {
    if (isAuthenticated && !user) hydrate();
  }, [isAuthenticated, user, hydrate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Загрузка…
      </div>
    );
  }

  const links = linksByRole(role);

  const handleLogout = () => {
    logout();
    navigate("/login");
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
          <span className="text-xl font-bold tracking-tight">medicina</span>
        </Link>

        <div className="px-4 pt-4 pb-2">
          <div className="w-full px-3 py-2 rounded-lg bg-white/5 text-sm text-white/70">
            {roleLabels[role]}
          </div>
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
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5",
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
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.fullName || "Пользователь"}
              </p>
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
