import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import ConfirmEmailScreen from "@/app/(auth)/confirm-email";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { useAppToast } from "@/hooks/use-app-toast";

// Mocks
const mockVerifyEmail = jest.fn();
const mockResendVerificationEmail = jest.fn();
const mockLogout = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const mockToastWarning = jest.fn();

(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
  replace: mockReplace,
});

(useAppToast as jest.Mock).mockReturnValue({
  success: mockToastSuccess,
  error: mockToastError,
  warning: mockToastWarning,
});

describe("ConfirmEmailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      unconfirmedEmail: "test@example.com",
      verifyEmail: mockVerifyEmail,
      resendVerificationEmail: mockResendVerificationEmail,
      logout: mockLogout,
      error: null,
      clearError: jest.fn(),
      needsEmailConfirmation: true,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it("renders correctly", () => {
    const { getByPlaceholderText, getByText } = render(<ConfirmEmailScreen />);
    
    expect(getByText("auth.verify_title")).toBeTruthy();
    expect(getByPlaceholderText("00000000")).toBeTruthy();
    expect(getByText("auth.verify_button")).toBeTruthy();
  });

  it("handles code input", () => {
    const { getByPlaceholderText } = render(<ConfirmEmailScreen />);
    
    const codeInput = getByPlaceholderText("00000000");
    fireEvent.changeText(codeInput, "12345678");

    expect(codeInput.props.value).toBe("12345678");
  });

  it("calls verifyEmail with correct code", async () => {
    const { getByPlaceholderText, getByText } = render(<ConfirmEmailScreen />);
    
    fireEvent.changeText(getByPlaceholderText("00000000"), "12345678");
    
    mockVerifyEmail.mockResolvedValue({ success: true });
    
    fireEvent.press(getByText("auth.verify_button"));

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith("12345678");
    });
  });

  it("handles resend code", async () => {
    const { getByText } = render(<ConfirmEmailScreen />);
    
    mockResendVerificationEmail.mockResolvedValue({ success: true });
    
    const resendButton = getByText("auth.resend_code");
    fireEvent.press(resendButton);

    await waitFor(() => {
      expect(mockResendVerificationEmail).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledWith("common.success", "auth.code_sent");
    });
  });

  it("redirects if session expired (no unconfirmedEmail)", () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      unconfirmedEmail: null,
      verifyEmail: mockVerifyEmail,
      needsEmailConfirmation: true,
    });

    const { getByText, getByPlaceholderText } = render(<ConfirmEmailScreen />);
    
    // Try to verify
    fireEvent.changeText(getByPlaceholderText("00000000"), "12345678");
    fireEvent.press(getByText("auth.verify_button"));

    expect(mockToastWarning).toHaveBeenCalledWith("common.warning", "auth.session_expired");
    expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
  });

  it("redirects on successful verification", () => {
    // Initial render with needsEmailConfirmation = true
    const { rerender } = render(<ConfirmEmailScreen />);

    // Simulate store update
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      unconfirmedEmail: "test@example.com",
      verifyEmail: mockVerifyEmail,
      needsEmailConfirmation: false,
      isAuthenticated: true,
    });

    rerender(<ConfirmEmailScreen />);

    expect(mockToastSuccess).toHaveBeenCalledWith("common.success", "auth.email_verified");
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
  });

  it("handles back to login", async () => {
    const { getByText } = render(<ConfirmEmailScreen />);
    
    fireEvent.press(getByText("auth.back_to_login"));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
    });
  });
});
