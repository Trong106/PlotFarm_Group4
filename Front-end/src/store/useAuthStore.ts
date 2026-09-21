import { create } from 'zustand';
import api from '@/lib/axios';
import { toast, useToastStore } from '@/store/useToastStore';
export interface UserProfile {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  roleName?: string;
  roleId?: number;
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
  clearError: () => void;
  login: (email?: string, password?: string) => Promise<boolean>;
  register: (data: { fullName: string; email: string; password: string; phoneNumber?: string }) => Promise<boolean>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: { fullName?: string; phoneNumber?: string | null }) => Promise<boolean>;
  logout: (redirectTo?: string) => void;
  initAuth: () => void;
  rehydrate: () => void;
}
const resolveRole = (data?: any): string => {
  if (!data) return 'Customer';
  const roleId = data.roleId ?? data.RoleId;
  const roleName = data.role ?? data.roleName ?? data.RoleName ?? '';
  const email = data.email ?? data.Email ?? '';

  if (roleId === 1 || email.toLowerCase() === 'admin@plotfarm.vn' || roleName.toLowerCase() === 'admin') {
    return 'Admin';
  }
  if (roleId === 2 || roleName.toLowerCase() === 'staff') {
    return 'Staff';
  }
  return roleName || 'Customer';
};

const normalizeUser = (data: any): UserProfile | null => {
  if (!data) return null;
  const properRole = resolveRole(data);
  return {
    ...data,
    userId: data.userId ?? data.UserId ?? 0,
    fullName: data.fullName ?? data.FullName ?? data.email ?? data.Email ?? '',
    email: data.email ?? data.Email ?? '',
    role: properRole,
    roleName: properRole,
    roleId: data.roleId ?? data.RoleId ?? (properRole === 'Admin' ? 1 : properRole === 'Staff' ? 2 : 3),
  };
};

let authErrorToastId: string | null = null;
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  clearError: () => {
    set({ error: null });
    if (authErrorToastId) {
      useToastStore.getState().removeToast(authErrorToastId);
      authErrorToastId = null;
    }
  },
  initAuth: () => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      // Headers remount during navigation/loading. Restore each session only once.
      if (storedToken && get().token === storedToken && get().isAuthenticated) return;
      if (storedToken) {
        let user: UserProfile | null = null;
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            user = normalizeUser(parsed);
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
    get().clearError();
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data || response.data;
      const normalizedUser = normalizeUser(user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
      }
      set({
        token,
        user: normalizedUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      toast.success(`Chào mừng ${normalizedUser?.fullName || normalizedUser?.email}! Vai trò: ${normalizedUser?.role}`, 'Đăng nhập thành công');
      return true;
    } catch (err: any) {
      const isNetworkError = !err.response;
      // Dev/Demo Fallback: Allow login with mock admin session if Backend API is offline
      if (isNetworkError) {
        const mockToken = 'mock-admin-token-demo';
        const mockUser: UserProfile = {
          userId: 1,
          fullName: 'Âu Lương Thành Trọng (Admin Demo)',
          email: email || 'admin@plotfarm.vn',
          role: 'Admin',
          roleName: 'Admin',
          roleId: 1,
          phoneNumber: '0901234567',
          status: 'ACTIVE',
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', mockToken);
          localStorage.setItem('user', JSON.stringify(mockUser));
          document.cookie = `token=${mockToken}; path=/; max-age=604800; SameSite=Lax`;
        }
        set({
          token: mockToken,
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        toast.info('Đã bật phiên Admin Demo (Máy chủ Backend 5000 đang chờ bắt đầu)', 'Đăng Nhập Admin Demo');
        return true;
      }
      const errorMessage =
        err.response?.data?.message || err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      set({
        error: errorMessage,
        isLoading: false,
      });
      authErrorToastId = toast.error(errorMessage, 'Đăng nhập không thành công');
      return false;
    }
  },
  register: async (data) => {
    get().clearError();
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', data);
      const resData = response.data.data || response.data;
      if (resData && resData.token) {
        const properRole = resolveRole(resData.user);
        const normalizedUser = resData.user ? {
          ...resData.user,
          role: properRole,
          roleName: properRole,
        } : null;
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', resData.token);
          if (normalizedUser) {
            localStorage.setItem('user', JSON.stringify(normalizedUser));
          }
          document.cookie = `token=${resData.token}; path=/; max-age=604800; SameSite=Lax`;
        }
        set({
          token: resData.token,
          user: normalizedUser,
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
      let errorMessage = 'Đăng ký thất bại.';
      if (isNetworkError) {
        errorMessage = 'Không thể kết nối đến máy chủ Backend (Cổng 5000). Vui lòng kiểm tra lại server.';
      } else if (err.response?.data?.errors && Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
        errorMessage = err.response.data.errors.map((e: any) => e.message).join('. ');
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      set({
        error: errorMessage,
        isLoading: false,
      });
      authErrorToastId = toast.error(errorMessage, 'Đăng ký không thành công');
      return false;
    }
  },
  fetchProfile: async () => {
    const token = get().token;
    if (!token || get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      let userData: any = null;
      try {
        const res = await api.get('/users/me');
        userData = res.data.data || res.data;
      } catch (err: any) {
        if (err.response?.status !== 404) throw err;
        const resAuth = await api.get('/auth/me');
        userData = resAuth.data.data || resAuth.data;
      }
      // Ignore a response from a session that has since logged out or changed.
      if (get().token !== token) return;
      if (userData) {
        const normalizedUser = normalizeUser(userData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(normalizedUser));
        }
        set({ user: normalizedUser, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      if (get().token !== token) return;
      if (err.response?.status === 401 || err.response?.status === 403) {
        get().logout();
      } else {
        set({ error: 'Không thể tải hồ sơ. Vui lòng kiểm tra kết nối và thử lại.', isLoading: false });
      }
    }
  },
  updateProfile: async (data: { fullName?: string; phoneNumber?: string | null }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch('/users/me', data);
      const updatedData = response.data.data || response.data;
      const currentUser = get().user;
      const properRole = resolveRole(updatedData || currentUser);
      const normalizedUser: UserProfile = {
        userId: updatedData.userId || currentUser?.userId || 0,
        fullName: updatedData.fullName || currentUser?.fullName || '',
        email: updatedData.email || currentUser?.email || '',
        role: properRole,
        roleName: properRole,
        roleId: updatedData.roleId || currentUser?.roleId,
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
  logout: (redirectTo: string = '/login') => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof sessionStorage !== 'undefined') { sessionStorage.setItem('logged_out', '1'); }
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    toast.info('Bạn đã đăng xuất khỏi hệ thống an toàn.', 'Đã đăng xuất');
    if (typeof window !== 'undefined' && window.location && redirectTo) {
      window.location.href = redirectTo;
    }
  },
}));
export default useAuthStore;