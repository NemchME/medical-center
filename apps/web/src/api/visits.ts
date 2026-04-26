import { api } from '@/services/api';
import type { ID, Prescription, Visit } from '@/types';

export const visitsApi = {
  async get(id: ID): Promise<Visit> {
    const { data } = await api.get<Visit>(`/visits/${id}`);
    return data;
  },
  async create(dto: {
    appointmentId: number;
    complaints?: string;
    diagnosis?: string;
    examination?: string;
    notes?: string;
  }): Promise<Visit> {
    const { data } = await api.post<Visit>('/visits', dto);
    return data;
  },
  async update(
    id: ID,
    dto: {
      complaints?: string;
      diagnosis?: string;
      examination?: string;
      notes?: string;
    },
  ): Promise<Visit> {
    const { data } = await api.patch<Visit>(`/visits/${id}`, dto);
    return data;
  },
  async close(id: ID, notes?: string): Promise<Visit> {
    const { data } = await api.patch<Visit>(`/visits/${id}/close`, { notes });
    return data;
  },
  async addPrescription(id: ID, text: string): Promise<Prescription> {
    const { data } = await api.post<Prescription>(`/visits/${id}/prescriptions`, { text });
    return data;
  },
  async removePrescription(prescriptionId: ID) {
    await api.delete(`/visits/prescriptions/${prescriptionId}`);
  },
};
