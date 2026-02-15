import SignupScreen from "@/app/(auth)/signup";
import { useAppToast } from "@/hooks/use-app-toast";
import { useAuthStore } from "@/store/authStore";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";

// Mocks
const mockSignUp = jest.fn();
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

describe("SignupScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
      error: null,
      clearError: jest.fn(),
      needsEmailConfirmation: false,
      isLoading: false,
    });
  });

  it("renders correctly", () => {
    const { getByPlaceholderText, getByText } = render(<SignupScreen />);

    expect(getByPlaceholderText("common.first_name")).toBeTruthy();
    expect(getByPlaceholderText("common.last_name")).toBeTruthy();
    expect(getByPlaceholderText("common.email")).toBeTruthy();
    expect(getByPlaceholderText("common.password")).toBeTruthy();
    expect(getByText("common.signup")).toBeTruthy();
  });

  it("handles input changes", () => {
    const { getByPlaceholderText } = render(<SignupScreen />);

    const firstNameInput = getByPlaceholderText("common.first_name");
    const lastNameInput = getByPlaceholderText("common.last_name");
    const emailInput = getByPlaceholderText("common.email");
    const passwordInput = getByPlaceholderText("common.password");

    fireEvent.changeText(firstNameInput, "John");
    fireEvent.changeText(lastNameInput, "Doe");
    fireEvent.changeText(emailInput, "john.doe@example.com");
    fireEvent.changeText(passwordInput, "securepassword123");

    expect(firstNameInput.props.value).toBe("John");
    expect(lastNameInput.props.value).toBe("Doe");
    expect(emailInput.props.value).toBe("john.doe@example.com");
    expect(passwordInput.props.value).toBe("securepassword123");
  });

  it("shows validation error for empty fields", async () => {
    const { getByText } = render(<SignupScreen />);

    const signupButton = getByText("common.signup");
    fireEvent.press(signupButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "common.warning",
        expect.any(String), // Zod error message
      );
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("calls signUp with correct data", async () => {
    const { getByPlaceholderText, getByText } = render(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText("common.first_name"), "John");
    fireEvent.changeText(getByPlaceholderText("common.last_name"), "Doe");
    fireEvent.changeText(
      getByPlaceholderText("common.email"),
      "john.doe@example.com",
    );
    fireEvent.changeText(
      getByPlaceholderText("common.password"),
      "SecurePassword123!",
    );

    mockSignUp.mockResolvedValue({ success: true });

    fireEvent.press(getByText("common.signup"));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        "john.doe@example.com",
        "SecurePassword123!",
        "John",
        "Doe",
      );
    });
  });

  it("displays error toast on signup failure", async () => {
    const { getByPlaceholderText, getByText } = render(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText("common.first_name"), "John");
    fireEvent.changeText(getByPlaceholderText("common.last_name"), "Doe");
    fireEvent.changeText(
      getByPlaceholderText("common.email"),
      "john.doe@example.com",
    );
    fireEvent.changeText(
      getByPlaceholderText("common.password"),
      "SecurePassword123!",
    );

    mockSignUp.mockResolvedValue({
      success: false,
      error: "User already exists",
    });

    fireEvent.press(getByText("common.signup"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "common.error",
        "User already exists",
      );
    });
  });

  it("redirects to confirm-email if needed", () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
      needsEmailConfirmation: true,
      isLoading: false,
    });

    render(<SignupScreen />);

    expect(mockReplace).toHaveBeenCalledWith("/(auth)/confirm-email");
  });

  it("navigates to login screen", () => {
    const { getByText } = render(<SignupScreen />);

    fireEvent.press(getByText("common.login"));

    expect(mockPush).toHaveBeenCalledWith("/(auth)/login");
  });
});
