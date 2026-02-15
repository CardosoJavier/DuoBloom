import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "@/app/(auth)/login";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { useAppToast } from "@/hooks/use-app-toast";

// Mock the AuthContainer to avoid complex rendering if needed, 
// but it seems simple enough.
// Mock Gluestack UI components if they cause trouble. 
// For now, let's assume they work or are simple views.

// We need to override the mocks from jest-setup.ts for specific tests
const mockLogin = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockToastError = jest.fn();

(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
  replace: mockReplace,
});

(useAppToast as jest.Mock).mockReturnValue({
  error: mockToastError,
});

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      error: null,
      clearError: jest.fn(),
      needsEmailConfirmation: false,
      isLoading: false,
    });
  });

  it("renders correctly", () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    expect(getByPlaceholderText("common.email")).toBeTruthy();
    expect(getByPlaceholderText("common.password")).toBeTruthy();
    expect(getByText("common.login")).toBeTruthy();
    expect(getByText("auth.signin_title")).toBeTruthy();
  });

  it("handles input changes", () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    
    const emailInput = getByPlaceholderText("common.email");
    const passwordInput = getByPlaceholderText("common.password");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");

    expect(emailInput.props.value).toBe("test@example.com");
    expect(passwordInput.props.value).toBe("password123");
  });

  it("shows validation error for empty fields", async () => {
    const { getByText } = render(<LoginScreen />);
    
    const loginButton = getByText("common.login");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "common.warning",
        expect.any(String) // Zod error message
      );
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("calls login with correct credentials", async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText("common.email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("common.password"), "password123");
    
    mockLogin.mockResolvedValue({ success: true });
    
    fireEvent.press(getByText("common.login"));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  it("displays error toast on login failure", async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText("common.email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("common.password"), "password123");
    
    mockLogin.mockResolvedValue({ success: false, error: "Invalid credentials" });
    
    fireEvent.press(getByText("common.login"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("common.error", "Invalid credentials");
    });
  });

  it("redirects to confirm-email if needed", () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      needsEmailConfirmation: true,
      isLoading: false,
    });

    render(<LoginScreen />);

    expect(mockReplace).toHaveBeenCalledWith("/(auth)/confirm-email");
  });

  it("navigates to signup screen", () => {
    const { getByText } = render(<LoginScreen />);
    
    fireEvent.press(getByText("common.signup"));
    
    expect(mockPush).toHaveBeenCalledWith("/(auth)/signup");
  });

  it("shows loading state", () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: true,
    });

    const { getByText } = render(<LoginScreen />);
    
    expect(getByText("auth.signing_in")).toBeTruthy();
    // Check if button is disabled - this depends on how Gluestack implements isDisabled
    // Usually it sets accessibilityState={{ disabled: true }}
    // But testing the text change is good enough for now.
  });
});
