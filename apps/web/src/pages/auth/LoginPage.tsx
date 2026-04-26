import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      const roles = user?.roles ?? [];
      if (roles.includes('admin') || roles.includes('manager')) {
        navigate('/admin/patients');
      } else if (roles.includes('doctor')) {
        navigate('/doctor/schedule');
      } else {
        navigate('/patient/appointments');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Неверный email или пароль');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cosmic flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-primary-400/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-primary-200 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/10">
            <Sparkles className="w-4 h-4" />
            Медицина
          </div>
          <h1 className="text-3xl font-extrabold text-white">Добро пожаловать</h1>
          <p className="mt-2 text-white/50">Войдите в свой аккаунт</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={cn(
                    'w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl',
                    'text-white placeholder:text-white/30',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400/50',
                    'transition-all duration-200',
                  )}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  id="password"
                  type="password"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={cn(
                    'w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl',
                    'text-white placeholder:text-white/30',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400/50',
                    'transition-all duration-200',
                  )}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold',
                'bg-gradient-to-r from-primary-500 to-primary-600',
                'hover:from-primary-400 hover:to-primary-500',
                'shadow-lg shadow-primary-500/25 hover:shadow-primary-400/30',
                'transform hover:-translate-y-0.5 transition-all duration-300',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
              )}
            >
              <LogIn className="w-5 h-5" />
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30 uppercase tracking-wider">или</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <p className="text-center text-white/50 text-sm">
            Нет аккаунта?{' '}
            <Link
              to="/register"
              className="text-primary-300 hover:text-primary-200 font-medium transition-colors"
            >
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
