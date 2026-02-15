import BloomScreen from "@/app/(auth)/bloom";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { usePartnerSync } from "@/hooks/usePartnerSync";

// Mocks
jest.mock("@/hooks/usePartnerSync");

const mockConnect = jest.fn();
const mockConfirm = jest.fn();

describe("BloomScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePartnerSync as jest.Mock).mockReturnValue({
      step: "input",
      isLoading: false,
      isConfirmed: false,
      partnerName: "",
      myCode: "ALEX-8392",
      connect: mockConnect,
      confirm: mockConfirm,
      checkStatus: jest.fn(),
    });
  });

  it("renders input state", () => {
    const { getByText, getByPlaceholderText } = render(<BloomScreen />);
    expect(getByText("auth.bloom_title")).toBeTruthy();
    // Use text matching for code since it's inside Heading
    expect(getByText("ALEX-8392")).toBeTruthy();
    expect(getByPlaceholderText("auth.enter_partner_code_placeholder")).toBeTruthy();
  });

  it("calls connect when button pressed", () => {
    const { getByText, getByPlaceholderText } = render(<BloomScreen />);
    const input = getByPlaceholderText("auth.enter_partner_code_placeholder");
    fireEvent.changeText(input, "PARTNER-123");
    
    fireEvent.press(getByText("auth.connect"));
    expect(mockConnect).toHaveBeenCalledWith("PARTNER-123");
  });

  it("renders waiting state", () => {
    (usePartnerSync as jest.Mock).mockReturnValue({
      step: "waiting",
      myCode: "ALEX-8392",
    });
    const { getByText } = render(<BloomScreen />);
    expect(getByText("auth.waiting_for_partner")).toBeTruthy();
  });

  it("renders found state and calls confirm", () => {
    (usePartnerSync as jest.Mock).mockReturnValue({
      step: "found",
      partnerName: "Sarah",
      confirm: mockConfirm,
      isConfirmed: false,
      isLoading: false,
    });
    const { getByText } = render(<BloomScreen />);
    expect(getByText("auth.partner_found")).toBeTruthy();
    
    fireEvent.press(getByText("auth.confirm_sync"));
    expect(mockConfirm).toHaveBeenCalled();
  });
});
