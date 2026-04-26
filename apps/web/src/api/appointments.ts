import { api } from '@/services/api';
import type { Appointment, AppointmentStatus, ID } from '@/types';

export interface AppointmentFilters {
  patientId?: ID;
  doctorId?: ID;
  status?: AppointmentStatus | string;
  from?: string;
  to?: string;
}

export const appointmentsApi = {
  async list(filters?: AppointmentFilters): Promise<Appointment[]> {
    const { data } = await api.get<Appointment[]>('/appointments', { params: filters });
    return data;
  },
  async mine(): Promise<Appointment[]> {
    const { data } = await api.get<Appointment[]>('/appointments/me');
    return data;
  },
  async mineDoctor(): Promise<Appointment[]> {
    const { data } = await api.get<Appointment[]>('/appointments/doctor/me');
    return data;
  },
  async get(id: ID): Promise<Appointment> {
    const { data } = await api.get<Appointment>(`/appointments/${id}`);
    return data;
  },
  async create(dto: {
    patientId: number;
    doctorId: number;
    centerId: number;
    startAt: string;
    durationMin?: number;
    sourceChannel?: string;
    serviceIds?: number[];
    testIds?: number[];
  }): Promise<Appointment> {
    const { data } = await api.post<Appointment>('/appointments', dto);
    return data;
  },
  async updateStatus(id: ID, status: AppointmentStatus): Promise<Appointment> {
    const { data } = await api.patch<Appointment>(`/appointments/${id}/status`, { status });
    return data;
  },
  async addService(id: ID, serviceId: ID, qty = 1) {
    const { data } = await api.post(`/appointments/${id}/services`, { serviceId, qty });
    return data;
  },
  async addTest(id: ID, testId: ID, qty = 1) {
    const { data } = await api.post(`/appointments/${id}/tests`, { testId, qty });
    return data;
  },
  async removeService(appointmentId: ID, rowId: ID) {
    await api.delete(`/appointments/${appointmentId}/services/${rowId}`);
  },
  async removeTest(appointmentId: ID, rowId: ID) {
    await api.delete(`/appointments/${appointmentId}/tests/${rowId}`);
  },
};
