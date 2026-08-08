import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  kycStatus: string;
  telephone?: string;
  dateNaissance?: string;
  adresse?: string;
  numeroPasseport?: string;
  dateDelivrance?: string;
  numeroNif?: string;
  paysResidenceFiscale?: string;
  profession?: string;
  trancheRevenus?: string;
  origineFonds?: string;
  avatar?: string;
  contratGenere?: boolean;
  contratSigne?: boolean;
  contratContenu?: string;
  opensignEnvelopeId?: string;
  opensignSigningUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateKycStatus: (status: string) => void;
  updateUser: (updatedFields: Partial<User>) => void;
}

const getStoredUser = (): User | null => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
};

const initialUser = getStoredUser();
const initialToken = localStorage.getItem('token') || null;

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken && !!initialUser,
  
  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateKycStatus: (status) => set((state) => {
    if (!state.user) return state;
    const updatedUser = { ...state.user, kycStatus: status };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return { user: updatedUser };
  }),

  updateUser: (updatedFields) => set((state) => {
    if (!state.user) return state;
    const updatedUser = { ...state.user, ...updatedFields };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return { user: updatedUser };
  }),
}));
