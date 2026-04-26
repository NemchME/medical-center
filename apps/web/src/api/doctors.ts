import { api } from '@/services/api';
import type { Doctor, DoctorSchedule, ID } from '@/types';

export const doctorsApi = {
  async list(centerId?: ID): Promise<Doctor[]> {
    const { data } = await api.get<Doctor[]>('/doctors', {
      params: centerId ? { centerId } : undefined,
    });
    return data;
  },
  async get(id: ID): Promise<Doctor> {
    const { data } = await api.get<Doctor>(`/doctors/${id}`);
    return data;
  },
  async create(dto: {
    userId?: number;
    centerId: number;
    fullName: string;
    specialization?: string;
    photoUrl?: string;
    experience?: string;
    education?: string;
    bio?: string;
  }): Promise<Doctor> {
    const { data } = await api.post<Doctor>('/doctors', dto);
    return data;
  },
  async update(id: ID, dto: Partial<Doctor>): Promise<Doctor> {
    const { data } = await api.patch<Doctor>(`/doctors/${id}`, dto);
    return data;
  },
  async remove(id: ID) {
    await api.delete(`/doctors/${id}`);
  },
  async schedule(doctorId: ID): Promise<DoctorSchedule[]> {
    const { data } = await api.get<DoctorSchedule[]>(`/doctors/${doctorId}/schedule`);
    return data;
  },
  async upsertSchedule(
    doctorId: ID,
    dto: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      slotMin?: number;
      isActive?: boolean;
    },
  ): Promise<DoctorSchedule> {
    const { data } = await api.post<DoctorSchedule>(`/doctors/${doctorId}/schedule`, dto);
    return data;
  },
  async bulkSetSchedule(
    doctorId: ID,
    items: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      slotMin?: number;
    }[],
  ): Promise<DoctorSchedule[]> {
    const { data } = await api.put<DoctorSchedule[]>(`/doctors/${doctorId}/schedule`, items);
    return data;
  },
};
