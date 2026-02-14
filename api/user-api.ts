import { supabase } from "@/util/supabase";
import { LoginData, SignupData, AuthResponse } from "@/types/auth";
import { User } from "@/types/user";

export const userApi = {
  /**
   * Signs up a new user with email, password, and metadata (firstName, lastName).
   * Note: The backend trigger 'handle_new_user' will automatically create the public.users record.
   */
  signUp: async (data: SignupData): Promise<AuthResponse> => {
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

      if (error) throw error;

      // Transform Supabase user to our internal User type if needed
      // For now, we return the session/user as is, or map it if the types diverge significantly.
      // We'll rely on the session for basic auth state.
      
      return {
        user: authData.user as unknown as User | null, // Casting for now, refine mapping as needed
        session: authData.session ? {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_in: authData.session.expires_in,
        } : null,
      };
    } catch (error: any) {
      console.error("SignUp API Error:", error.message);
      return { user: null, session: null, error: error.message };
    }
  },

  /**
   * Signs in an existing user with email and password.
   */
  signIn: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password!,
      });

      if (error) throw error;

      return {
        user: authData.user as unknown as User | null,
        session: authData.session ? {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_in: authData.session.expires_in,
        } : null,
      };
    } catch (error: any) {
      console.error("SignIn API Error:", error.message);
      return { user: null, session: null, error: error.message };
    }
  },

  /**
   * Signs out the current user.
   */
  signOut: async (): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return {};
    } catch (error: any) {
      console.error("SignOut API Error:", error.message);
      return { error: error.message };
    }
  },

  /**
   * Checks the current session status.
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("GetSession API Error:", error.message);
      return null;
    }
    return data.session;
  },

  /**
   * Get public user profile from the 'users' table.
   */
  getUserProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("GetUserProfile API Error:", error.message);
      return { data: null, error: error.message };
    }
  }
};
