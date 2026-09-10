import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  // Shortcut helpers
  success: (message: string, title?: string, duration?: number) => string;
  error: (message: string, title?: string, duration?: number) => string;
  warning: (message: string, title?: string, duration?: number) => string;
  info: (message: string, title?: string, duration?: number) => string;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = {
      ...toast,
      id,
      duration: toast.duration ?? 4000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => set({ toasts: [] }),

  success: (message, title = 'Thành công', duration = 4000) => {
    return get().addToast({ type: 'success', title, message, duration });
  },

  error: (message, title = 'Có lỗi xảy ra', duration = 5000) => {
    return get().addToast({ type: 'error', title, message, duration });
  },

  warning: (message, title = 'Cảnh báo', duration = 4500) => {
    return get().addToast({ type: 'warning', title, message, duration });
  },

  info: (message, title = 'Thông báo', duration = 4000) => {
    return get().addToast({ type: 'info', title, message, duration });
  },
}));

export const toast = {
  success: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().success(message, title, duration),
  error: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().error(message, title, duration),
  warning: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().warning(message, title, duration),
  info: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().info(message, title, duration),
};
