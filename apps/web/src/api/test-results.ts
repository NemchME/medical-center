import { api } from '@/services/api';
import type { ID, TestResult } from '@/types';

export const testResultsApi = {
  async mine(): Promise<TestResult[]> {
    const { data } = await api.get<TestResult[]>('/test-results/me');
    return data;
  },
  async byPatient(patientId: ID): Promise<TestResult[]> {
    const { data } = await api.get<TestResult[]>(`/test-results/patient/${patientId}`);
    return data;
  },
  async get(id: ID): Promise<TestResult> {
    const { data } = await api.get<TestResult>(`/test-results/${id}`);
    return data;
  },
  async create(dto: {
    patientId: number;
    testId: number;
    result: string;
    unit?: string;
    refRange?: string;
    status?: string;
  }): Promise<TestResult> {
    const { data } = await api.post<TestResult>('/test-results', dto);
    return data;
  },
  async update(id: ID, dto: Partial<TestResult>): Promise<TestResult> {
    const { data } = await api.patch<TestResult>(`/test-results/${id}`, dto);
    return data;
  },
  async markReady(id: ID): Promise<TestResult> {
    const { data } = await api.patch<TestResult>(`/test-results/${id}/ready`);
    return data;
  },
  async remove(id: ID) {
    await api.delete(`/test-results/${id}`);
  },
};
