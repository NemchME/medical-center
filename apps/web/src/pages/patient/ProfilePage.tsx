import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, MapPin, Save, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/auth.store';

function getInitials(fullName: string): string {
  if (!fullName) return 'U';
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function ProfilePage() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me(),
  });

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: 'male',
    address: '',
  });

  useEffect(() => {
    if (me) {
      setForm({
        fullName: me.fullName ?? '',
        email: me.email ?? '',
        phone: me.profile?.phone ?? me.patient?.phone ?? '',
        birthDate: (me.profile?.birthDate ?? me.patient?.birthDate ?? '').slice(0, 10),
        gender: me.profile?.gender ?? me.patient?.gender ?? 'male',
        address: me.profile?.address ?? me.patient?.address ?? '',
      });
    }
  }, [me]);

  const mutation = useMutation({
    mutationFn: () =>
      authApi.updateMe({
        fullName: form.fullName,
        phone: form.phone,
        birthDate: form.birthDate || undefined,
        gender: form.gender,
        address: form.address,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      hydrate();
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  if (isLoading || !me) {
    return <div className="text-gray-500 text-center py-12">Загрузка профиля…</div>;
  }

  const saved = mutation.isSuccess && !mutation.isPending;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Профиль</h2>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-purple-600 to-purple-400" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div className="h-24 w-24 rounded-full border-4 border-white bg-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0">
              {getInitials(form.fullName)}
            </div>
            <div className="flex-1 pt-2 sm:pt-0 sm:pb-1">
              <h3 className="text-xl font-bold text-gray-900">{form.fullName}</h3>
              <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {form.email}
                </span>
                {form.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    {form.phone}
                  </span>
                )}
                {form.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {form.address}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <User className="h-5 w-5 text-purple-600" />
          Личные данные
        </h3>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
              ФИО
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              disabled
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
              Телефон
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1.5">
              Дата рождения
            </label>
            <input
              id="birthDate"
              name="birthDate"
              type="date"
              value={form.birthDate}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
            {form.birthDate && (
              <p className="mt-1 text-xs text-gray-400">
                {format(new Date(form.birthDate), 'd MMMM yyyy г.', { locale: ru })}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1.5">
              Пол
            </label>
            <select
              id="gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none bg-white"
            >
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
              Адрес
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={form.address}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50',
              saved
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-purple-600 hover:bg-purple-700 active:scale-[0.98]',
            )}
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Сохранено
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {mutation.isPending ? 'Сохранение…' : 'Сохранить изменения'}
              </>
            )}
          </button>
          {mutation.isError && (
            <span className="inline-flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" /> Не удалось сохранить
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
