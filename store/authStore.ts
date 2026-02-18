import { userApi } from "@/api/user-api";
import { ErrorCode } from "@/types/error";
import { User } from "@/types/user";
import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  needsEmailConfirmation: boolean;
  unconfirmedEmail: string | null;
  user: User | null;
  error: string | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  checkSyncStatus: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isInitializing: true,
  isLoading: false,
  needsEmailConfirmation: false,
  unconfirmedEmail: null,
  user: null,
  error: null,

  clearError: () => set({ error: null }),

  refreshUser: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const result = await userApi.getUserProfile(user.id);
      if (result.success && result.data) {
        set({ user: { ...user, ...result.data } });
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  },

  checkAuth: async () => {
    try {
      set({ isInitializing: true });
      const result = await userApi.getSession();

      if (result.success && result.data?.user) {
        set({
          isAuthenticated: true,
          user: result.data.user,
          needsEmailConfirmation: false,
        });
      } else {
        set({
          isAuthenticated: false,
          user: null,
          needsEmailConfirmation: false,
        });
      }
    } catch (error: any) {
      console.error("Auth check failed:", error.message || "Unknown error");
      set({ isAuthenticated: false, user: null });
    } finally {
      set({ isInitializing: false });
    }
  },

  checkSyncStatus: async () => {
    const { user } = get();
    if (!user) return false;

    // Check if user has a relationship
    const { syncApi } = await import("@/api/sync-api");
    const result = await syncApi.getRelationship(user.id);

    return result.success && !!result.data;
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
          unconfirmedEmail: email,
          error: null,
        });
      } else {
        set({
          isLoading: false,
          error: result.error.message,
          isAuthenticated: false,
        });
      }
      return { success: false, error: result.error.message };
    }

    const { user, session } = result.data;

    if (!user || !session) {
      set({
        isAuthenticated: false,
        isLoading: false,
        error: "Unexpected error",
      });
      return { success: false, error: "Unexpected error" };
    }

    const completeUser = await userApi.getUserProfile(user.id);
    if (!completeUser.success || !completeUser.data) {
      set({
        isAuthenticated: false,
        isLoading: false,
        error: "Unexpected error",
      });
      return { success: false, error: "Unexpected error" };
    }

    set({
      isAuthenticated: true,
      user: completeUser.data,
      isLoading: false,
      needsEmailConfirmation: false,
    });
    return { success: true };
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
      return { success: false, error: result.error.message };
    }

    const { user, session } = result.data;

    if (session) {
      // Fetch full profile to get pairCode immediately after signup
      if (user) {
        const profileResult = await userApi.getUserProfile(user.id);
        if (profileResult.success && profileResult.data) {
          Object.assign(user, profileResult.data);
        }
      }

      set({
        isAuthenticated: true,
        user: user,
        isLoading: false,
        needsEmailConfirmation: false,
      });
      return { success: true };
    } else {
      // Supabase might return no session if email confirmation is required
      // We assume if success=true but no session, it's the confirmation flow
      set({
        isAuthenticated: false,
        isLoading: false,
        needsEmailConfirmation: true,
        unconfirmedEmail: email,
        error: null,
      });
      return { success: true };
    }
  },

  verifyEmail: async (token) => {
    const { unconfirmedEmail } = get();
    if (!unconfirmedEmail) {
      set({ error: "No email to verify" });
      return { success: false, error: "No email to verify" };
    }
    set({ isLoading: true, error: null });
    const result = await userApi.verifyEmailOtp(unconfirmedEmail, token);

    if (!result.success) {
      set({ isLoading: false, error: result.error.message });
      return { success: false, error: result.error.message };
    }

    const { user, session } = result.data;
    if (session) {
      set({
        isAuthenticated: true,
        user: user,
        isLoading: false,
        needsEmailConfirmation: false,
        unconfirmedEmail: null,
      });
      return { success: true };
    } else {
      // Should not happen on successful verification usually, but safe fallback
      const errorMsg =
        "Verification successful but session not established. Please login.";
      set({
        isLoading: false,
        needsEmailConfirmation: false,
        unconfirmedEmail: null,
        error: errorMsg,
      });
      return { success: false, error: errorMsg };
    }
  },

  resendVerificationEmail: async () => {
    const { unconfirmedEmail } = get();
    if (!unconfirmedEmail) {
      set({ error: "No email to resend verification to" });
      return { success: false, error: "No email to resend verification to" };
    }
    set({ isLoading: true, error: null });
    const result = await userApi.resendOtp(unconfirmedEmail);

    if (!result.success) {
      set({ isLoading: false, error: result.error.message });
      return { success: false, error: result.error.message };
    }

    set({ isLoading: false });
    return { success: true };
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
