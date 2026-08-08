import { create } from 'zustand';

interface ThemeState {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: (localStorage.getItem('theme-mode') as 'light' | 'dark') || 'dark',
  toggleTheme: () => set((state) => {
    const nextMode = state.mode === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme-mode', nextMode);
    return { mode: nextMode };
  }),
  setTheme: (mode) => {
    localStorage.setItem('theme-mode', mode);
    set({ mode });
  }
}));
