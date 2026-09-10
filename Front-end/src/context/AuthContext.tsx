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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to sync state with Zustand store and localStorage
  const syncAuthState = useCallback((newToken: string | null, newUser: UserProfile | null) => {
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(!!newToken && !!newUser);

    // Sync Zustand
    useAuthStore.setState({
      token: newToken,
      user: newUser,
      isAuthenticated: !!newToken && !!newUser,
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

      if (newUser) {
        localStorage.setItem('user', JSON.stringify(newUser));
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

  // Refresh user profile from backend (/api/auth/me)
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const userData = res.data.data || res.data;
      if (userData) {
        setUser(userData);
        useAuthStore.setState({ user: userData });
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
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
          const res = await api.get('/auth/me', {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });
          const freshUser = res.data.data || res.data;
          syncAuthState(savedToken, freshUser);
        } catch (apiErr: any) {
          // If token has expired or is invalid, clean up
          if (apiErr.response?.status === 401) {
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

        // If backend returned token and user upon registration, log in directly
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
