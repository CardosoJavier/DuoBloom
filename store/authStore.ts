import { userApi } from "@/api/user-api";
import { User } from "@/types/user";
import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const session = await userApi.getSession();

      if (session?.user) {
        // In a real app, you might want to fetch the full user profile here
        // For now we just set authenticated
        set({ isAuthenticated: true, user: session.user as unknown as User });
      } else {
        set({ isAuthenticated: false, user: null });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      set({ isAuthenticated: false, user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    const response = await userApi.signIn({ email, password });

    if (response.error) {
      set({ isLoading: false, error: response.error, isAuthenticated: false });
      throw new Error(response.error);
    }

    if (response.session) {
      set({ isAuthenticated: true, user: response.user, isLoading: false });
    } else {
      set({
        isAuthenticated: false,
        isLoading: false,
        error: "No session created",
      });
    }
  },

  signUp: async (email, password, firstName, lastName) => {
    set({ isLoading: true, error: null });
    const response = await userApi.signUp({
      email,
      password,
      firstName,
      lastName,
    });

    if (response.error) {
      set({ isLoading: false, error: response.error, isAuthenticated: false });
      throw new Error(response.error);
    }

    if (response.session) {
      set({ isAuthenticated: true, user: response.user, isLoading: false });
    } else {
      // Supabase might return no session if email confirmation is required
      set({
        isAuthenticated: false,
        isLoading: false,
        error: "Please check your email to confirm your account.",
      });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await userApi.signOut();
    set({ isAuthenticated: false, user: null, isLoading: false });
  },
}));
