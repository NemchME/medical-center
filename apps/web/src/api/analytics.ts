import { api } from '@/services/api';
import type { AnalyticsOverview } from '@/types';

export const analyticsApi = {
  async overview(): Promise<AnalyticsOverview> {
    const { data } = await api.get<AnalyticsOverview>('/analytics/overview');
    return data;
  },
  async appointmentsByMonth(): Promise<{ month: string; count: number }[]> {
    const { data } = await api.get('/analytics/appointments-by-month');
    return data;
  },
  async doctorLoad(): Promise<{ doctorId: number; fullName: string; count: number }[]> {
    const { data } = await api.get('/analytics/doctor-load');
    return data;
  },
  async noShowTrend(): Promise<{ month: string; total: number; noShows: number; rate: number }[]> {
    const { data } = await api.get('/analytics/no-show-trend');
    return data;
  },
};
