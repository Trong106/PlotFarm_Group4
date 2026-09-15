'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore, UserProfile } from '@/store/useAuthStore';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email?: string, password?: string) => Promise<boolean>;
  register: (data: { fullName: string; email: string; password: string; phoneNumber?: string }) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const resolveRole = (data?: Partial<UserProfile> | null): string => {
  if (!data) return 'Customer';
  if (data.roleId === 1 || data.email === 'admin@plotfarm.vn' || data.role?.toLowerCase() === 'admin') {
    return 'Admin';
  }
  if (data.roleId === 2 || data.role?.toLowerCase() === 'staff') {
    return 'Staff';
  }
  return data.role || data.roleName || 'Customer';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to sync state with Zustand store and localStorage
  const syncAuthState = useCallback((newToken: string | null, newUser: UserProfile | null) => {
    let normalizedUser = newUser;
    if (normalizedUser) {
      const properRole = resolveRole(normalizedUser);
      normalizedUser = {
        ...normalizedUser,
        role: properRole,
        roleName: properRole,
      };
    }

    setToken(newToken);
    setUser(normalizedUser);
    setIsAuthenticated(!!newToken && !!normalizedUser);

    // Sync Zustand
    useAuthStore.setState({
      token: newToken,
      user: normalizedUser,
      isAuthenticated: !!newToken && !!normalizedUser,
      ...(!newToken ? { isLoading: false } : {}),
    });

    // Sync localStorage and cookies
    if (typeof window !== 'undefined') {
      if (newToken) {
        localStorage.setItem('token', newToken);
        document.cookie = `token=${newToken}; path=/; max-age=604800; SameSite=Lax`;
      } else {
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }

      if (normalizedUser) {
        localStorage.setItem('user', JSON.stringify(normalizedUser));
      } else {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    syncAuthState(null, null);
    setError(null);
  }, [syncAuthState]);

  // Refresh user profile from backend (/api/auth/me or /api/users/me)
  const refreshUser = useCallback(async () => {
    try {
      let userData: any = null;
      try {
        const res = await api.get('/users/me');
        userData = res.data.data || res.data;
      } catch (err: any) {
        if (err.response?.status !== 404) throw err;
        const res = await api.get('/auth/me');
        userData = res.data.data || res.data;
      }

      if (userData) {
        const properRole = resolveRole(userData);
        const normalized = {
          ...userData,
          role: properRole,
          roleName: properRole,
        };
        setUser(normalized);
        useAuthStore.setState({ user: normalized });
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(normalized));
        }
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      }
    }
  }, [logout]);

  // Rehydrate auth state on initial mount or page refresh (F5)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }

        const savedToken = localStorage.getItem('token');
        const savedUserStr = localStorage.getItem('user');

        if (!savedToken) {
          syncAuthState(null, null);
          setIsLoading(false);
          return;
        }

        // Instant rehydration from cache so UI renders with zero lag
        let parsedUser: UserProfile | null = null;
        if (savedUserStr) {
          try {
            parsedUser = JSON.parse(savedUserStr);
            if (parsedUser) {
              const properRole = resolveRole(parsedUser);
              parsedUser.role = properRole;
              parsedUser.roleName = properRole;
            }
          } catch {
            parsedUser = null;
          }
        }

        setToken(savedToken);
        if (parsedUser) {
          setUser(parsedUser);
          setIsAuthenticated(true);
          useAuthStore.setState({
            token: savedToken,
            user: parsedUser,
            isAuthenticated: true,
          });
        }

        // Verify token freshness and retrieve latest user profile in background
        try {
          let freshUser: any = null;
          try {
            const res = await api.get('/users/me', {
              headers: { Authorization: `Bearer ${savedToken}` },
            });
            freshUser = res.data.data || res.data;
          } catch (err: any) {
            if (err.response?.status !== 404) throw err;
            const res = await api.get('/auth/me', {
              headers: { Authorization: `Bearer ${savedToken}` },
            });
            freshUser = res.data.data || res.data;
          }

          if (localStorage.getItem('token') !== savedToken) return;
          const mergedUser = parsedUser ? { ...parsedUser, ...freshUser } : freshUser;
          syncAuthState(savedToken, mergedUser);
        } catch (apiErr: any) {
          // If token has expired or is invalid, clean up
          if (apiErr.response?.status === 401 || apiErr.response?.status === 403) {
            logout();
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [syncAuthState, logout]);

  // Login handler
  const login = useCallback(
    async (email?: string, password?: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.post('/auth/login', { email, password });
        const { token: newToken, user: newUser } = response.data.data || response.data;

        syncAuthState(newToken, newUser);
        setIsLoading(false);
        return true;
      } catch (err: any) {
        const isNetworkError = !err.response;
        const errorMsg = isNetworkError
          ? 'Không thể kết nối đến máy chủ Backend (Cổng 5000). Vui lòng kiểm tra lại server.'
          : (err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');

        setError(errorMsg);
        setIsLoading(false);
        return false;
      }
    },
    [syncAuthState]
  );

  // Register handler
  const register = useCallback(
    async (data: { fullName: string; email: string; password: string; phoneNumber?: string }): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.post('/auth/register', data);
        const { token: newToken, user: newUser } = response.data.data || response.data;

        if (newToken && newUser) {
          syncAuthState(newToken, newUser);
        }

        setIsLoading(false);
        return true;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Đăng ký thất bại.';
        setError(errorMsg);
        setIsLoading(false);
        return false;
      }
    },
    [syncAuthState]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
