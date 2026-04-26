import { api } from '@/services/api';
import type { ID, Notification } from '@/types';

export const notificationsApi = {
  async list(status?: string): Promise<Notification[]> {
    const { data } = await api.get<Notification[]>('/notifications', {
      params: status ? { status } : undefined,
    });
    return data;
  },
  async byAppointment(appointmentId: ID): Promise<Notification[]> {
    const { data } = await api.get<Notification[]>(`/notifications/appointment/${appointmentId}`);
    return data;
  },
  async create(dto: { appointmentId: number; type: string; plannedAt: string }): Promise<Notification> {
    const { data } = await api.post<Notification>('/notifications', dto);
    return data;
  },
  async markSent(id: ID): Promise<Notification> {
    const { data } = await api.patch<Notification>(`/notifications/${id}/sent`);
    return data;
  },
  async markFailed(id: ID): Promise<Notification> {
    const { data } = await api.patch<Notification>(`/notifications/${id}/failed`);
    return data;
  },
  async remove(id: ID) {
    await api.delete(`/notifications/${id}`);
  },
};
