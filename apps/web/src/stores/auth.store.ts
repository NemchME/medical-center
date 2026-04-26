import { create } from 'zustand';
import { authApi } from '@/api/auth';
import type { User } from '@/types';

export type AppRole = 'patient' | 'doctor' | 'admin' | 'manager';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    birthDate?: string;
    role?: AppRole;
  }) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

function primaryRole(roles: string[] | undefined): AppRole {
  if (!roles?.length) return 'patient';
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('manager')) return 'manager';
  if (roles.includes('doctor')) return 'doctor';
  return 'patient';
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem('accessToken', res.accessToken);
      const me = await authApi.me();
      set({ user: me, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (dto) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register(dto);
      localStorage.setItem('accessToken', res.accessToken);
      const me = await authApi.me();
      set({ user: me, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    if (!localStorage.getItem('accessToken')) return;
    set({ isLoading: true });
    try {
      const me = await authApi.me();
      set({ user: me, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export function useCurrentRole(): AppRole {
  const user = useAuthStore((s) => s.user);
  return primaryRole(user?.roles);
}
