import { userApi } from "@/api/user-api";
import { ErrorCode } from "@/types/error";
import { User } from "@/types/user";
import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  needsEmailConfirmation: boolean;
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
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  needsEmailConfirmation: false,
  user: null,
  error: null,

  clearError: () => set({ error: null }),

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const result = await userApi.getSession();

      if (result.success && result.data?.user) {
        set({
          isAuthenticated: true,
          user: result.data.user as unknown as User,
          needsEmailConfirmation: false,
        });
      } else {
        set({
          isAuthenticated: false,
          user: null,
          needsEmailConfirmation: false,
        });
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
    const result = await userApi.signIn({ email, password });

    if (!result.success) {
      if (result.error.code === ErrorCode.AUTH_EMAIL_NOT_CONFIRMED) {
        set({
          isLoading: false,
          needsEmailConfirmation: true,
          isAuthenticated: false,
          error: null,
        });
      } else {
        set({
          isLoading: false,
          error: result.error.message,
          isAuthenticated: false,
        });
      }
      return;
    }

    const { user, session } = result.data;
    if (session) {
      set({
        isAuthenticated: true,
        user: user,
        isLoading: false,
        needsEmailConfirmation: false,
      });
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
    const result = await userApi.signUp({
      email,
      password,
      firstName,
      lastName,
    });

    if (!result.success) {
      set({
        isLoading: false,
        error: result.error.message,
        isAuthenticated: false,
      });
      return;
    }

    const { user, session } = result.data;

    if (session) {
      set({
        isAuthenticated: true,
        user: user,
        isLoading: false,
        needsEmailConfirmation: false,
      });
    } else {
      // Supabase might return no session if email confirmation is required
      // We assume if success=true but no session, it's the confirmation flow
      set({
        isAuthenticated: false,
        isLoading: false,
        needsEmailConfirmation: true,
        error: null,
      });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await userApi.signOut();
    set({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      needsEmailConfirmation: false,
    });
  },
}));
