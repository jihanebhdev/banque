import { create } from 'zustand';

export type Language = 'FR';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'FR',
  setLanguage: (lang) => {},
}));

