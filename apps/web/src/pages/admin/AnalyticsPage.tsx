import { Users, CalendarCheck, AlertTriangle, Clock } from 'lucide-react';
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
import { USE_MOCK, MOCK_ANALYTICS } from '@/data/mock';
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
};

export function AnalyticsPage() {
  const analytics = USE_MOCK ? MOCK_ANALYTICS : null;

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Нет данных для аналитики
      </div>
    );
  }

  const statusData = analytics.appointmentsByStatus.map((item) => ({
    ...item,
    fill: STATUS_COLORS[item.status] || '#9ca3af',
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Аналитика</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          value={analytics.totalPatients}
          label="Всего пациентов"
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          icon={CalendarCheck}
          value={analytics.totalAppointments}
          label="Всего записей"
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          icon={AlertTriangle}
          value={`${analytics.noShowRate}%`}
          label="Процент неявок"
          trend={{ value: 2.1, positive: false }}
        />
        <StatCard
          icon={Clock}
          value={`${analytics.avgWaitDays} дн.`}
          label="Среднее ожидание"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Записи по месяцам
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.appointmentsByMonth}>
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
                <Legend
                  wrapperStyle={{ fontSize: '13px' }}
                />
                <Bar
                  dataKey="total"
                  name="Всего"
                  fill="#7c3aed"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="noShow"
                  name="Неявки"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Статусы записей
          </h3>
          <div className="h-80">
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
          Загрузка врачей
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={analytics.doctorLoad}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
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
                formatter={(value: number) => [`${value}%`, 'Загрузка']}
              />
              <Bar dataKey="load" name="Загрузка" radius={[0, 6, 6, 0]}>
                {analytics.doctorLoad.map((_, index) => (
                  <Cell
                    key={index}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
 