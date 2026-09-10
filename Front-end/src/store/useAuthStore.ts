import { create } from 'zustand';
import api from '@/lib/axios';
import { toast } from '@/store/useToastStore';

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
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initAuth: () => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        set({ token: storedToken, isAuthenticated: true });
        get().fetchProfile();
      }
    }
  },

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
        error: null,
      });

      toast.success(`Chào mừng ${user.fullName || user.email}! Vai trò: ${user.role}`, 'Đăng nhập thành công');
      return true;
    } catch (err: any) {
      const isNetworkError = !err.response;
      const errorMessage = isNetworkError
        ? 'Không thể kết nối đến máy chủ Backend (Cổng 5000). Vui lòng kiểm tra lại server.'
        : err.response?.data?.message || err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';

      set({
        error: errorMessage,
        isLoading: false,
      });
      toast.error(errorMessage, 'Đăng nhập không thành công');
      return false;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', data);
      const resData = response.data.data || response.data;

      // Nếu backend trả về token sau khi đăng ký
      if (resData && resData.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', resData.token);
          document.cookie = `token=${resData.token}; path=/; max-age=604800; SameSite=Lax`;
        }
        set({
          token: resData.token,
          user: resData.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        toast.success(`Tài khoản ${resData.user?.fullName || ''} đã được tạo thành công!`, 'Đăng ký thành công');
      } else {
        set({ isLoading: false });
        toast.success('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.', 'Đăng ký thành công');
      }

      return true;
    } catch (err: any) {
      const isNetworkError = !err.response;
      const errorMessage = isNetworkError
        ? 'Không thể kết nối đến máy chủ Backend (Cổng 5000). Vui lòng kiểm tra lại server.'
        : err.response?.data?.message || err.message || 'Đăng ký thất bại.';

      set({
        error: errorMessage,
        isLoading: false,
      });
      toast.error(errorMessage, 'Đăng ký không thành công');
      return false;
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.data, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
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
    toast.info('Bạn đã đăng xuất khỏi hệ thống an toàn.', 'Đã đăng xuất');
  },
}));
