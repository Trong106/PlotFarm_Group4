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
  mockLogin: (email: string, role?: string) => Promise<boolean>;
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
      const { token, user } = response.data.data || response.data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
      }

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      // Fallback for mock testing when Backend API server is offline
      const isNetworkError = !err.response;
      const errorMsg = isNetworkError 
        ? 'Không thể kết nối đến máy chủ Backend (Cổng 5000). Đang sử dụng chế độ Mock Login thử nghiệm.'
        : (err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');

      set({
        error: errorMsg,
        isLoading: false,
      });
      return false;
    }
  },

  mockLogin: async (email: string, role = 'FARMER') => {
    set({ isLoading: true, error: null });
    await new Promise((res) => setTimeout(res, 800));
    const mockToken = `mock_jwt_token_${Date.now()}`;
    const mockUser: UserProfile = {
      userId: 101,
      fullName: email.split('@')[0] || 'Người dùng PlotFarm',
      email: email || 'user@plotfarm.vn',
      role: role,
      phoneNumber: '0987654321',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      status: 'ACTIVE'
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('token', mockToken);
      document.cookie = `token=${mockToken}; path=/; max-age=604800; SameSite=Lax`;
    }

    set({
      token: mockToken,
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
    });
    return true;
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
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },
}));
