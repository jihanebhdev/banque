import { create } from 'zustand';
import api from '../api/axiosConfig';

interface ConfigState {
  bankName: string;
  logoUrl: string | null;
  loading: boolean;
  fetchConfig: () => Promise<void>;
  setConfig: (bankName: string, logoUrl: string | null) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  bankName: 'Banque Nationale',
  logoUrl: null,
  loading: true,
  fetchConfig: async () => {
    try {
      const res = await api.get('/api/config/public');
      set({ 
        bankName: res.data.bankName || 'Banque Nationale', 
        logoUrl: res.data.logoUrl || null,
        loading: false 
      });
    } catch (e) {
      console.error("Failed to fetch global config:", e);
      set({ loading: false });
    }
  },
  setConfig: (bankName, logoUrl) => set({ bankName, logoUrl })
}));
