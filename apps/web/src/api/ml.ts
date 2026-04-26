import { api } from '@/services/api';
import type { ID, MlPrediction } from '@/types';

export const mlApi = {
  async get(appointmentId: ID): Promise<MlPrediction | null> {
    const { data } = await api.get<MlPrediction | null>(`/ml/predictions/${appointmentId}`);
    return data;
  },
  async predict(appointmentId: ID): Promise<{ appointmentId: number; noShowProbability: number }> {
    const { data } = await api.post(`/ml/predictions/${appointmentId}`);
    return data;
  },
  async reload(): Promise<{ status: string; modelVersion: string }> {
    const { data } = await api.post('/ml/reload');
    return data;
  },
};
