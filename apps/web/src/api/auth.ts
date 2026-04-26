import { api } from '@/services/api';
import type { User } from '@/types';

export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    roles: string[];
  };
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  async register(dto: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    birthDate?: string;
    role?: string;
  }): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', dto);
    return data;
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/users/me');
    return data;
  },

  async updateMe(dto: {
    fullName?: string;
    phone?: string;
    birthDate?: string;
    gender?: string;
    address?: string;
  }): Promise<User> {
    const { data } = await api.patch<User>('/users/me', dto);
    return data;
  },
};
