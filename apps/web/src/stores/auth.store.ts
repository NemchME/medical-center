import { create } from 'zustand';
import { api } from '@/services/api';
import { USE_MOCK, MOCK_CURRENT_USER } from '@/data/mock';

interface User {
  id: number;
  email: string;
  fullName: string;
  roles?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: 'patient' | 'doctor' | 'admin';
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string }) => Promise<void>;
  logout: () => void;
  setRole: (role: 'patient' | 'doctor' | 'admin') => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: USE_MOCK ? MOCK_CURRENT_USER : null,
  isAuthenticated: USE_MOCK ? true : !!localStorage.getItem('accessToken'),
  role: (localStorage.getItem('mockRole') as 'patient' | 'doctor' | 'admin') || 'patient',

  login: async (email, password) => {
    if (USE_MOCK) {
      set({ user: MOCK_CURRENT_USER, isAuthenticated: true });
      return;
    }
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    set({ user: data.user, isAuthenticated: true });
  },

  register: async (dto) => {
    if (USE_MOCK) {
      set({
        user: { id: 99, email: dto.email, fullName: dto.fullName, roles: ['patient'] },
        isAuthenticated: true,
      });
      return;
    }
    const { data } = await api.post('/auth/register', dto);
    localStorage.setItem('accessToken', data.accessToken);
    set({ user: data.user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, isAuthenticated: false });
  },

  setRole: (role) => {
    localStorage.setItem('mockRole', role);
    set({ role });
  },
}));
