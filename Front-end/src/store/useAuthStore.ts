import { create } from 'zustand';
import api from '@/lib/axios';
import { User, Role } from '@/lib/mockData';

interface AuthState {
  user: User | null;
  token: string | null;
  usersList: User[];
  rolesList: Role[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email?: string, password?: string) => Promise<boolean>;
  logout: () => void;
  fetchUsers: () => Promise<void>;
  fetchRoles: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  usersList: [],
  rolesList: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email = 'tuan.customer@gmail.com', password = 'password123') => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Đăng nhập thất bại',
        isLoading: false,
      });
      return false;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/users');
      set({ usersList: res.data.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  fetchRoles: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/roles');
      set({ rolesList: res.data.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },
}));
