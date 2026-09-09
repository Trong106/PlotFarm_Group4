import { create } from 'zustand';
import api from '@/lib/axios';

export interface UserProfile {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  phoneNumber?: string;
  avatarUrl?: string;
  status?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email?: string, password?: string) => Promise<boolean>;
  register: (data: { fullName: string; email: string; password: string; phoneNumber?: string }) => Promise<boolean>;
  fetchProfile: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email = 'admin@plotfarm.vn', password = 'password123') => {
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
        error: err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.',
        isLoading: false,
      });
      return false;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/register', data);
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Đăng ký thất bại.',
        isLoading: false,
      });
      return false;
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.data, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ user: null, isAuthenticated: false, isLoading: false });
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
}));
