import { ApiResult } from "@/types/api";
import { AuthResponse } from "@/types/auth";
import { LoginData, SignupData } from "@/types/auth-schema";
import { AppError, ErrorCode } from "@/types/error";
import { User } from "@/types/user";
import { supabase } from "@/util/supabase";

// Helper to map Supabase Auth User to our User type
const mapAuthUser = (user: any): User => {
  return {
    id: user.id,
    email: user.email || "",
    firstName: user.user_metadata?.firstName || "",
    lastName: user.user_metadata?.lastName || "",
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
};

// Helper to map DB User (public.users) to our User type
const mapDbUser = (user: any): User => {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    createdAt: user.created_on,
    updatedAt: user.last_updated_on,
    pairCode: user.pair_code,
  };
};

const mapSupabaseError = (error: any): AppError => {
  const message = error.message || "An unknown error occurred";
  let code = ErrorCode.UNKNOWN_ERROR;

  if (message.includes("Invalid login credentials")) {
    code = ErrorCode.AUTH_INVALID_CREDENTIALS;
    return { code, message: "errors.auth_invalid_credentials", originalError: error };
  } else if (message.includes("Email not confirmed")) {
    code = ErrorCode.AUTH_EMAIL_NOT_CONFIRMED;
    return { code, message: "errors.auth_email_not_confirmed", originalError: error };
  } else if (message.includes("User already registered")) {
    code = ErrorCode.AUTH_USER_ALREADY_EXISTS;
    return { code, message: "errors.auth_user_already_exists", originalError: error };
  } else if (message.includes("Password should be")) {
    code = ErrorCode.AUTH_WEAK_PASSWORD;
    return { code, message: "errors.auth_weak_password", originalError: error };
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
        console.error("SignUp API Error:", error.message || "Unknown error");
        return { success: false, error: mapSupabaseError(error) };
      }

      // Transform Supabase user to our internal User type
      return {
        success: true,
        data: {
          user: authData.user ? mapAuthUser(authData.user) : null,
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
      console.error("SignUp API Error:", error.message || "Unknown error");
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
        console.error("SignIn API Error:", error.message || "Unknown error");
        return { success: false, error: mapSupabaseError(error) };
      }

      return {
        success: true,
        data: {
          user: authData.user ? mapAuthUser(authData.user) : null,
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
      console.error("SignIn API Error:", error.message || "Unknown error");
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
      if (error) {
        console.error("SignOut API Error:", error.message || "Unknown error");
        return { success: false, error: mapSupabaseError(error) };
      }
      return { success: true, data: undefined };
    } catch (error: any) {
      console.error("SignOut API Error:", error.message || "Unknown error");
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
   * Verifies the email using the OTP token.
   */
  verifyEmailOtp: async (
    email: string,
    token: string,
  ): Promise<ApiResult<AuthResponse>> => {
    try {
      const { data: authData, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "signup",
      });

      if (error) {
        console.error(
          "VerifyEmailOtp API Error:",
          error.message || "Unknown error",
        );
        return { success: false, error: mapSupabaseError(error) };
      }

      return {
        success: true,
        data: {
          user: authData.user ? mapAuthUser(authData.user) : null,
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
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || "Unexpected error during verification",
          originalError: error,
        },
      };
    }
  },

  /**
   * Resends the signup confirmation OTP.
   */
  resendOtp: async (email: string): Promise<ApiResult<void>> => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        console.error("ResendOtp API Error:", error.message || "Unknown error");
        return { success: false, error: mapSupabaseError(error) };
      }

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || "Unexpected error during resend",
          originalError: error,
        },
      };
    }
  },

  /**
   * Retrieves the current session.
   */
  getSession: async (): Promise<ApiResult<AuthResponse>> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error(
          "GetSession API Error:",
          error.message || "Unknown error",
        );
        return { success: false, error: mapSupabaseError(error) };
      }

      // If we have a session, we should try to fetch the full profile to get pairCode
      let user = data.session?.user ? mapAuthUser(data.session.user) : null;

      if (user && user.id) {
        const profileResult = await userApi.getUserProfile(user.id);
        if (profileResult.success && profileResult.data) {
          user = profileResult.data;
        }
      }

      return {
        success: true,
        data: {
          user: user,
          session: data.session
            ? {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_in: data.session.expires_in,
              }
            : null,
        },
      };
    } catch (error: any) {
      console.error("GetSession API Error:", error.message || "Unknown error");
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || "Unexpected error retrieving session",
          originalError: error,
        },
      };
    }
  },

  /**
   * Get public user profile from the 'users' table.
   */
  getUserProfile: async (userId: string): Promise<ApiResult<User>> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error(
          "GetUserProfile API Error:",
          error.message || "Unknown error",
        );
        // Return a specific error but don't crash flow if profile is missing (though it shouldn't be)
        return {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: error.message,
            originalError: error,
          },
        };
      }

      return { success: true, data: mapDbUser(data) };
    } catch (error: any) {
      console.error(
        "GetUserProfile API Error:",
        error.message || "Unknown error",
      );
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || "Unknown error",
          originalError: error,
        },
      };
    }
  },
};
