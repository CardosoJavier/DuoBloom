import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import BloomScreen from "@/app/(auth)/bloom";
import { useRouter } from "expo-router";

// Mocks
const mockPush = jest.fn();

(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

describe("BloomScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    const { getByText, getByPlaceholderText } = render(<BloomScreen />);
    
    expect(getByText("auth.bloom_title")).toBeTruthy();
    expect(getByText("BLOOM-X7Y2")).toBeTruthy(); // My code
    expect(getByPlaceholderText("BLOOM-XXXX")).toBeTruthy();
    expect(getByText("auth.connect_partner")).toBeTruthy();
  });

  it("handles pair code input", () => {
    const { getByPlaceholderText } = render(<BloomScreen />);
    
    const input = getByPlaceholderText("BLOOM-XXXX");
    fireEvent.changeText(input, "BLOOM-1234");

    expect(input.props.value).toBe("BLOOM-1234");
  });

  it("navigates to login on skip", () => {
    const { getByText } = render(<BloomScreen />);
    
    fireEvent.press(getByText("Skip for now"));
    
    expect(mockPush).toHaveBeenCalledWith("/(auth)/login");
  });

  // Since handleBloom is empty, we can't test much logic yet.
  // But we can check if the button is present.
});
