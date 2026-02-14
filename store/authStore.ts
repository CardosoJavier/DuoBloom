import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  
  checkAuth: async () => {
    try {
      // Mock delay to simulate session check
      await new Promise((resolve) => setTimeout(resolve, 1000));
      set({ isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async () => {
    set({ isLoading: true });
    // Mock login delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ isAuthenticated: true, isLoading: false });
  },

  signUp: async (email, password, firstName, lastName) => {
    set({ isLoading: true });
    // Mock signup delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log("Signing up with:", { email, firstName, lastName });
    set({ isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ isAuthenticated: false, isLoading: false });
  },
}));
