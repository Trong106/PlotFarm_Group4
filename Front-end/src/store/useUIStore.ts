import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark';
  isDemoModalOpen: boolean;
  activeTab: 'components' | 'state' | 'mock-api';
  toggleTheme: () => void;
  setDemoModalOpen: (isOpen: boolean) => void;
  setActiveTab: (tab: 'components' | 'state' | 'mock-api') => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  isDemoModalOpen: false,
  activeTab: 'components',

  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { theme: nextTheme };
    });
  },

  setDemoModalOpen: (isOpen) => set({ isDemoModalOpen: isOpen }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
