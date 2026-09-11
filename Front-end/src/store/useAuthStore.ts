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
  createdAt?: string;
  updatedAt?: string;
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
  updateProfile: (data: { fullName?: string; phoneNumber?: string | null }) => Promise<boolean>;
  logout: () => void;
  initAuth: () => void;
  rehydrate: () => void;
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
      const storedUser = localStorage.getItem('user');
      if (storedToken) {
        let user: UserProfile | null = null;
        if (storedUser) {
          try {
            user = JSON.parse(storedUser);
          } catch {
            user = null;
          }
        }
        set({ token: storedToken, user, isAuthenticated: true });
        get().fetchProfile();
      }
    }
  },

  rehydrate: () => {
    get().initAuth();
  },

  login: async (email = 'admin@plotfarm.vn', password = 'password123') => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data || response.data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
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

      if (resData && resData.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', resData.token);
          if (resData.user) {
            localStorage.setItem('user', JSON.stringify(resData.user));
          }
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
      // Prioritize /users/me to get the rich profile with phoneNumber, roleName, etc.
      let userData: any = null;
      try {
        const res = await api.get('/users/me');
        const d = res.data.data || res.data;
        if (d) {
          userData = {
            ...d,
            role: d.roleName || d.role || 'Customer',
          };
        }
      } catch {
        // Fallback to /auth/me if /users/me fails
        const resAuth = await api.get('/auth/me');
        userData = resAuth.data.data || resAuth.data;
      }

      if (typeof window !== 'undefined' && userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      set({ user: userData, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      if (err.response?.status === 401) {
        get().logout();
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
  },

  updateProfile: async (data: { fullName?: string; phoneNumber?: string | null }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch('/users/me', data);
      const updatedData = response.data.data || response.data;

      const currentUser = get().user;
      const normalizedUser: UserProfile = {
        userId: updatedData.userId || currentUser?.userId || 0,
        fullName: updatedData.fullName || currentUser?.fullName || '',
        email: updatedData.email || currentUser?.email || '',
        role: updatedData.roleName || updatedData.role || currentUser?.role || 'Customer',
        phoneNumber: updatedData.phoneNumber !== undefined ? updatedData.phoneNumber : currentUser?.phoneNumber,
        avatarUrl: updatedData.avatarUrl || currentUser?.avatarUrl,
        status: updatedData.status || currentUser?.status,
        createdAt: updatedData.createdAt || currentUser?.createdAt,
        updatedAt: updatedData.updatedAt || currentUser?.updatedAt,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(normalizedUser));
      }

      set({
        user: normalizedUser,
        isLoading: false,
        error: null,
      });

      toast.success('Cập nhật thông tin hồ sơ thành công!', 'Hồ sơ cá nhân');
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Cập nhật hồ sơ thất bại.';
      set({ isLoading: false, error: msg });
      toast.error(msg, 'Lỗi cập nhật');
      return false;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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

export default useAuthStore;
