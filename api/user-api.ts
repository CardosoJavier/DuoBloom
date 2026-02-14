import { ApiResult } from "@/types/api";
import { AuthResponse, LoginData, SignupData } from "@/types/auth";
import { AppError, ErrorCode } from "@/types/error";
import { User } from "@/types/user";
import { supabase } from "@/util/supabase";
import { Session } from "@supabase/supabase-js";

const mapSupabaseError = (error: any): AppError => {
  const message = error.message || "An unknown error occurred";
  let code = ErrorCode.UNKNOWN_ERROR;

  if (message.includes("Invalid login credentials")) {
    code = ErrorCode.AUTH_INVALID_CREDENTIALS;
  } else if (message.includes("Email not confirmed")) {
    code = ErrorCode.AUTH_EMAIL_NOT_CONFIRMED;
  } else if (message.includes("User already registered")) {
    code = ErrorCode.AUTH_USER_ALREADY_EXISTS;
  } else if (message.includes("Password should be")) {
    code = ErrorCode.AUTH_WEAK_PASSWORD;
  }

  return {
    code,
    message,
    originalError: error,
  };
};

export const userApi = {
  /**
   * Signs up a new user with email, password, and metadata (firstName, lastName).
   * Note: The backend trigger 'handle_new_user' will automatically create the public.users record.
   */
  signUp: async (data: SignupData): Promise<ApiResult<AuthResponse>> => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password!,
        options: {
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
          },
        },
      });

      if (error) {
        return { success: false, error: mapSupabaseError(error) };
      }

      // Transform Supabase user to our internal User type if needed
      return {
        success: true,
        data: {
          user: authData.user as unknown as User | null,
          session: authData.session
            ? {
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token,
                expires_in: authData.session.expires_in,
              }
            : null,
        },
      };
    } catch (error: any) {
      console.error("SignUp API Error:", error);
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || "Unexpected error during signup",
          originalError: error,
        },
      };
    }
  },

  /**
   * Signs in an existing user with email and password.
   */
  signIn: async (data: LoginData): Promise<ApiResult<AuthResponse>> => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password!,
      });

      if (error) {
        return { success: false, error: mapSupabaseError(error) };
      }

      return {
        success: true,
        data: {
          user: authData.user as unknown as User | null,
          session: authData.session
            ? {
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token,
                expires_in: authData.session.expires_in,
              }
            : null,
        },
      };
    } catch (error: any) {
      console.error("SignIn API Error:", error);
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || "Unexpected error during login",
          originalError: error,
        },
      };
    }
  },

  /**
   * Signs out the current user.
   */
  signOut: async (): Promise<ApiResult<void>> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { success: false, error: mapSupabaseError(error) };
      return { success: true, data: undefined };
    } catch (error: any) {
      console.error("SignOut API Error:", error);
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || "Unexpected error during signout",
          originalError: error,
        },
      };
    }
  },

  /**
   * Checks the current session status.
   */
  getSession: async (): Promise<ApiResult<Session | null>> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        return { success: false, error: mapSupabaseError(error) };
      }
      return { success: true, data: data.session };
    } catch (error: any) {
      console.error("GetSession API Error:", error);
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || "Unexpected error getting session",
          originalError: error,
        },
      };
    }
  },

  /**
   * Get public user profile from the 'users' table.
   */
  getUserProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("GetUserProfile API Error:", error.message);
      return { data: null, error: error.message };
    }
  },
};
