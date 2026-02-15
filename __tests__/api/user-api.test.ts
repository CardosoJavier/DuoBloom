import { userApi } from "@/api/user-api";
import { supabase } from "@/util/supabase";
import { ErrorCode } from "@/types/error";

// Mock Supabase
jest.mock("@/util/supabase", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      verifyOtp: jest.fn(),
      resend: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe("userApi", () => {
  const mockEmail = "test@example.com";
  const mockPassword = "password123";
  const mockFirstName = "John";
  const mockLastName = "Doe";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signUp", () => {
    it("should sign up a user successfully", async () => {
      const mockAuthData = {
        user: {
          id: "123",
          email: mockEmail,
          user_metadata: { firstName: mockFirstName, lastName: mockLastName },
          created_at: "2023-01-01",
          updated_at: "2023-01-01",
        },
        session: {
          access_token: "token",
          refresh_token: "refresh",
          expires_in: 3600,
        },
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      const result = await userApi.signUp({
        email: mockEmail,
        password: mockPassword,
        firstName: mockFirstName,
        lastName: mockLastName,
      });

      expect(result.success).toBe(true);
      expect(result.data?.user?.email).toBe(mockEmail);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: mockEmail,
        password: mockPassword,
        options: {
          data: {
            firstName: mockFirstName,
            lastName: mockLastName,
          },
        },
      });
    });

    it("should handle signup error", async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "User already registered" },
      });

      const result = await userApi.signUp({
        email: mockEmail,
        password: mockPassword,
        firstName: mockFirstName,
        lastName: mockLastName,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCode.AUTH_USER_ALREADY_EXISTS);
    });

    it("should handle unexpected error during signup", async () => {
      (supabase.auth.signUp as jest.Mock).mockRejectedValue(new Error("Network error"));

      const result = await userApi.signUp({
        email: mockEmail,
        password: mockPassword,
        firstName: mockFirstName,
        lastName: mockLastName,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCode.UNKNOWN_ERROR);
    });
  });

  describe("signIn", () => {
    it("should sign in a user successfully", async () => {
      const mockAuthData = {
        user: {
          id: "123",
          email: mockEmail,
          user_metadata: { firstName: mockFirstName, lastName: mockLastName },
          created_at: "2023-01-01",
          updated_at: "2023-01-01",
        },
        session: {
          access_token: "token",
          refresh_token: "refresh",
          expires_in: 3600,
        },
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      const result = await userApi.signIn({
        email: mockEmail,
        password: mockPassword,
      });

      expect(result.success).toBe(true);
      expect(result.data?.user?.email).toBe(mockEmail);
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: mockEmail,
        password: mockPassword,
      });
    });

    it("should handle invalid credentials", async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" },
      });

      const result = await userApi.signIn({
        email: mockEmail,
        password: mockPassword,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCode.AUTH_INVALID_CREDENTIALS);
    });

    it("should handle email not confirmed", async () => {
        (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
          data: { user: null, session: null },
          error: { message: "Email not confirmed" },
        });
  
        const result = await userApi.signIn({
          email: mockEmail,
          password: mockPassword,
        });
  
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCode.AUTH_EMAIL_NOT_CONFIRMED);
      });
  });

  describe("signOut", () => {
    it("should sign out successfully", async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const result = await userApi.signOut();

      expect(result.success).toBe(true);
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it("should handle sign out error", async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: { message: "Error signing out" },
      });

      const result = await userApi.signOut();

      expect(result.success).toBe(false);
    });
  });

  describe("verifyEmailOtp", () => {
    it("should verify email otp successfully", async () => {
        const mockAuthData = {
            user: {
              id: "123",
              email: mockEmail,
              user_metadata: { firstName: mockFirstName, lastName: mockLastName },
              created_at: "2023-01-01",
              updated_at: "2023-01-01",
            },
            session: {
              access_token: "token",
              refresh_token: "refresh",
              expires_in: 3600,
            },
          };

      (supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      const result = await userApi.verifyEmailOtp(mockEmail, "123456");

      expect(result.success).toBe(true);
      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        email: mockEmail,
        token: "123456",
        type: "signup",
      });
    });

    it("should handle verify otp error", async () => {
      (supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid token" },
      });

      const result = await userApi.verifyEmailOtp(mockEmail, "123456");

      expect(result.success).toBe(false);
    });
  });

  describe("resendOtp", () => {
    it("should resend otp successfully", async () => {
      (supabase.auth.resend as jest.Mock).mockResolvedValue({ error: null });

      const result = await userApi.resendOtp(mockEmail);

      expect(result.success).toBe(true);
      expect(supabase.auth.resend).toHaveBeenCalledWith({
        email: mockEmail,
        type: "signup",
      });
    });

    it("should handle resend otp error", async () => {
      (supabase.auth.resend as jest.Mock).mockResolvedValue({
        error: { message: "Wait before resending" },
      });

      const result = await userApi.resendOtp(mockEmail);

      expect(result.success).toBe(false);
    });
  });
});
