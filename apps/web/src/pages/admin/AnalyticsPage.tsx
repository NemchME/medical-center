import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, CalendarCheck, AlertTriangle, Stethoscope } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { analyticsApi } from '@/api/analytics';
import StatCard from '@/components/ui/StatCard';

const CHART_COLORS = [
  '#7c3aed',
  '#8b5cf6',
  '#a78bfa',
  '#c4b5fd',
  '#6d28d9',
  '#5b21b6',
  '#4c1d95',
];

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  confirmed: '#3b82f6',
  pending: '#eab308',
  cancelled: '#9ca3af',
  no_show: '#ef4444',
  in_progress: '#a855f7',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Завершённые',
  confirmed: 'Подтверждённые',
  pending: 'Ожидают',
  cancelled: 'Отменённые',
  no_show: 'Неявки',
  in_progress: 'В работе',
};

export function AnalyticsPage() {
  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsApi.overview(),
  });
  const { data: byMonth = [] } = useQuery({
    queryKey: ['analytics', 'appointments-by-month'],
    queryFn: () => analyticsApi.appointmentsByMonth(),
  });
  const { data: trend = [] } = useQuery({
    queryKey: ['analytics', 'no-show-trend'],
    queryFn: () => analyticsApi.noShowTrend(),
  });
  const { data: doctorLoad = [] } = useQuery({
    queryKey: ['analytics', 'doctor-load'],
    queryFn: () => analyticsApi.doctorLoad(),
  });

  const statusData = useMemo(
    () =>
      (overview?.appointmentsByStatus ?? []).map((item) => ({
        ...item,
        label: STATUS_LABELS[item.status] ?? item.status,
        fill: STATUS_COLORS[item.status] ?? '#9ca3af',
      })),
    [overview],
  );

  const monthsMerged = useMemo(() => {
    const byMap = new Map(byMonth.map((m) => [m.month, m.count]));
    return trend.map((t) => ({
      month: t.month,
      total: byMap.get(t.month) ?? t.total,
      noShows: t.noShows,
    }));
  }, [byMonth, trend]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Аналитика</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} value={overview?.totalPatients ?? 0} label="Всего пациентов" />
        <StatCard
          icon={CalendarCheck}
          value={overview?.totalAppointments ?? 0}
          label="Всего записей"
        />
        <StatCard
          icon={AlertTriangle}
          value={`${Math.round((overview?.noShowRate ?? 0) * 100)}%`}
          label="Процент неявок"
        />
        <StatCard icon={Stethoscope} value={overview?.totalDoctors ?? 0} label="Врачей" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Записи по месяцам</h3>
          <div className="h-80">
            {monthsMerged.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-400">
                Нет данных
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthsMerged}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '13px' }} />
                  <Bar dataKey="total" name="Всего" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="noShows" name="Неявки" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Статусы записей</h3>
          <div className="h-80">
            {statusData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-400">
                Нет данных
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="label"
                    label={({ label, percent }) =>
                      `${label} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-4">
            {statusData.map((item) => (
              <div key={item.status} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                {item.label}: {item.count}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Загрузка врачей (за 30 дней)
        </h3>
        <div className="h-80">
          {doctorLoad.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              Нет данных
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doctorLoad} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="fullName"
                  width={180}
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [value, 'Приёмов']}
                />
                <Bar dataKey="count" name="Приёмов" radius={[0, 6, 6, 0]}>
                  {doctorLoad.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
