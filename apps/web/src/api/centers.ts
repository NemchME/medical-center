import { api } from '@/services/api';
import type { ClinicCenter, ID } from '@/types';

export const centersApi = {
  async list(): Promise<ClinicCenter[]> {
    const { data } = await api.get<ClinicCenter[]>('/centers');
    return data;
  },
  async get(id: ID): Promise<ClinicCenter> {
    const { data } = await api.get<ClinicCenter>(`/centers/${id}`);
    return data;
  },
  async create(dto: {
    code: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    timezone?: string;
  }): Promise<ClinicCenter> {
    const { data } = await api.post<ClinicCenter>('/centers', dto);
    return data;
  },
  async update(id: ID, dto: Partial<ClinicCenter>): Promise<ClinicCenter> {
    const { data } = await api.patch<ClinicCenter>(`/centers/${id}`, dto);
    return data;
  },
  async remove(id: ID) {
    await api.delete(`/centers/${id}`);
  },
};
