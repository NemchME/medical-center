import { api } from '@/services/api';
import type { ID, Patient } from '@/types';

export const patientsApi = {
  async list(search?: string): Promise<Patient[]> {
    const { data } = await api.get<Patient[]>('/patients', {
      params: search ? { search } : undefined,
    });
    return data;
  },
  async get(id: ID): Promise<Patient> {
    const { data } = await api.get<Patient>(`/patients/${id}`);
    return data;
  },
  async me(): Promise<Patient> {
    const { data } = await api.get<Patient>('/patients/me');
    return data;
  },
  async create(dto: {
    userId?: number;
    fullName: string;
    birthDate?: string;
    phone?: string;
    email?: string;
    gender?: string;
    address?: string;
  }): Promise<Patient> {
    const { data } = await api.post<Patient>('/patients', dto);
    return data;
  },
  async update(id: ID, dto: Partial<Patient>): Promise<Patient> {
    const { data } = await api.patch<Patient>(`/patients/${id}`, dto);
    return data;
  },
  async remove(id: ID) {
    await api.delete(`/patients/${id}`);
  },
};
