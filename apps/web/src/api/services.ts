import { api } from '@/services/api';
import type { ID, LabTest, Service } from '@/types';

export const servicesApi = {
  async listServices(): Promise<Service[]> {
    const { data } = await api.get<Service[]>('/services');
    return data;
  },
  async listTests(): Promise<LabTest[]> {
    const { data } = await api.get<LabTest[]>('/services/tests');
    return data;
  },
  async createService(dto: {
    code: string;
    name: string;
    description?: string;
    durationMinDefault?: number;
  }): Promise<Service> {
    const { data } = await api.post<Service>('/services', dto);
    return data;
  },
  async updateService(id: ID, dto: Partial<Service>): Promise<Service> {
    const { data } = await api.patch<Service>(`/services/${id}`, dto);
    return data;
  },
  async removeService(id: ID) {
    await api.delete(`/services/${id}`);
  },
  async createTest(dto: {
    code: string;
    name: string;
    description?: string;
    sampleType?: string;
    preparation?: string;
  }): Promise<LabTest> {
    const { data } = await api.post<LabTest>('/services/tests', dto);
    return data;
  },
  async updateTest(id: ID, dto: Partial<LabTest>): Promise<LabTest> {
    const { data } = await api.patch<LabTest>(`/services/tests/${id}`, dto);
    return data;
  },
  async removeTest(id: ID) {
    await api.delete(`/services/tests/${id}`);
  },
  async setServicePrice(serviceId: ID, dto: { centerId: number; price: number; currency?: string }) {
    const { data } = await api.post(`/services/${serviceId}/prices`, dto);
    return data;
  },
  async setTestPrice(testId: ID, dto: { centerId: number; price: number; currency?: string }) {
    const { data } = await api.post(`/services/tests/${testId}/prices`, dto);
    return data;
  },
};
