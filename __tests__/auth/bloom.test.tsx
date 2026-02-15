import BloomScreen from "@/app/(auth)/bloom";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React from "react";

// Mocks
const mockReplace = jest.fn();
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(),
}));

jest.mock("@/hooks/use-app-toast", () => ({
  useAppToast: () => mockToast,
}));

(useRouter as jest.Mock).mockReturnValue({
  replace: mockReplace,
});

describe("BloomScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the input step correctly", () => {
    const { getByText, getByPlaceholderText } = render(<BloomScreen />);

    expect(getByText("auth.bloom_title")).toBeTruthy();
    expect(getByText("ALEX-8392")).toBeTruthy(); // My code
    expect(
      getByPlaceholderText("auth.enter_partner_code_placeholder"),
    ).toBeTruthy();
    expect(getByText("auth.connect")).toBeTruthy();
  });

  it("copies code to clipboard when copy button is pressed", async () => {
    const { getByLabelText } = render(<BloomScreen />);

    const copyButton = getByLabelText("Copy code");
    fireEvent.press(copyButton);

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith("ALEX-8392");
      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  it("does not proceed if partner code is empty", () => {
    const { getByText, queryByText } = render(<BloomScreen />);
    const connectBtn = getByText("auth.connect");
    fireEvent.press(connectBtn);

    // Advance time to ensure no transition happens
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Should still be in input step
    expect(getByText("auth.bloom_title")).toBeTruthy();
    expect(queryByText("auth.waiting_for_partner")).toBeNull();
  });

  it("transitions through states: input -> waiting -> found -> success", async () => {
    const { getByText, getByPlaceholderText } = render(<BloomScreen />);

    // 1. Input Step
    const input = getByPlaceholderText("auth.enter_partner_code_placeholder");
    fireEvent.changeText(input, "SARAH-1234");

    const connectBtn = getByText("auth.connect");
    fireEvent.press(connectBtn);

    // Advance timer for first timeout (1500ms)
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // 2. Waiting Step
    await waitFor(() => {
      expect(getByText("auth.waiting_for_partner")).toBeTruthy();
    });

    // Advance timer for second timeout (3000ms)
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // 3. Found Step
    await waitFor(() => {
      expect(getByText("auth.partner_found")).toBeTruthy();
    });

    // 4. Confirm
    const confirmBtn = getByText("auth.confirm_sync");
    fireEvent.press(confirmBtn);

    expect(mockToast.success).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
  });
});
