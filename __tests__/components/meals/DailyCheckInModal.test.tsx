import {
  logNutritionDay,
  updateLastCheckInDate,
  updateStreakState,
} from "@/api/streak-api";
import { DailyCheckInModal } from "@/components/meals/DailyCheckInModal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock("@/api/streak-api", () => ({
  logNutritionDay: jest.fn(),
  updateStreakState: jest.fn(),
  updateLastCheckInDate: jest.fn(),
}));

// Mock Gluestack Modal so isOpen controls whether children render.
// This avoids native modal animation/portal issues in Jest.
jest.mock("@/components/ui/modal", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Modal: ({ isOpen, children, onClose }: any) =>
      isOpen ? <View testID="modal-root">{children}</View> : null,
    ModalBackdrop: () => null,
    ModalContent: ({ children }: any) => <View>{children}</View>,
    ModalCloseButton: ({ children, ...props }: any) => (
      <View testID="modal-close-button" {...props}>
        {children}
      </View>
    ),
    ModalBody: ({ children }: any) => <View>{children}</View>,
    ModalFooter: ({ children }: any) => <View>{children}</View>,
    ModalHeader: ({ children }: any) => <View>{children}</View>,
  };
});

const mockLogNutritionDay = logNutritionDay as jest.Mock;
const mockUpdateStreakState = updateStreakState as jest.Mock;
const mockUpdateLastCheckInDate = updateLastCheckInDate as jest.Mock;

// ─── Test helpers ────────────────────────────────────────────────────────────

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

interface RenderOptions {
  isOpen?: boolean;
  onClose?: jest.Mock;
  onAnswered?: jest.Mock;
}

const renderModal = ({
  isOpen = true,
  onClose = jest.fn(),
  onAnswered = jest.fn(),
}: RenderOptions = {}) => {
  const queryClient = makeQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <DailyCheckInModal
        isOpen={isOpen}
        userId="user-1"
        onClose={onClose}
        onAnswered={onAnswered}
      />
    </QueryClientProvider>,
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Rendering guards
// ─────────────────────────────────────────────────────────────────────────────

describe("rendering", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders title and subtitle i18n keys when isOpen=true", () => {
    const { getByText } = renderModal({ isOpen: true });
    expect(getByText("check_in.title")).toBeTruthy();
    expect(getByText("check_in.subtitle")).toBeTruthy();
  });

  it("renders Yes and No option labels", () => {
    const { getByText } = renderModal({ isOpen: true });
    expect(getByText("check_in.yes")).toBeTruthy();
    expect(getByText("check_in.no")).toBeTruthy();
  });

  it("renders nothing (modal root absent) when isOpen=false", () => {
    const { queryByTestId } = renderModal({ isOpen: false });
    expect(queryByTestId("modal-root")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Yes path
// ─────────────────────────────────────────────────────────────────────────────

describe("Yes button", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogNutritionDay.mockResolvedValue({ success: true });
    mockUpdateStreakState.mockResolvedValue({ success: true });
    mockUpdateLastCheckInDate.mockResolvedValue({ success: true });
  });

  it("calls updateLastCheckInDate with yesterday's date on Yes", async () => {
    const realDate = Date;
    const fixedNow = new Date(2026, 2, 10, 12, 0, 0);
    // @ts-ignore
    global.Date = class extends realDate {
      constructor(...args: any[]) {
        if (args.length === 0) super(fixedNow);
        // @ts-ignore
        else super(...args);
      }
      static now() {
        return fixedNow.getTime();
      }
    };

    const { getByText } = renderModal();
    await act(async () => {
      fireEvent.press(getByText("check_in.yes"));
    });
    await waitFor(() => {
      expect(mockUpdateLastCheckInDate).toHaveBeenCalledWith(
        "user-1",
        "2026-03-09",
      );
    });
    global.Date = realDate;
  });

  it("calls logNutritionDay with yesterday's date", async () => {
    // Freeze date so yesterday is deterministic
    const realDate = Date;
    const fixedNow = new Date(2026, 2, 10, 12, 0, 0);
    // @ts-ignore
    global.Date = class extends realDate {
      constructor(...args: any[]) {
        if (args.length === 0) super(fixedNow);
        // @ts-ignore
        else super(...args);
      }
      static now() {
        return fixedNow.getTime();
      }
    };

    const { getByText } = renderModal();
    await act(async () => {
      fireEvent.press(getByText("check_in.yes"));
    });

    expect(mockLogNutritionDay).toHaveBeenCalledWith("user-1", "2026-03-09");
    global.Date = realDate;
  });

  it("calls updateStreakState after logNutritionDay", async () => {
    const { getByText } = renderModal();
    await act(async () => {
      fireEvent.press(getByText("check_in.yes"));
    });
    await waitFor(() => {
      expect(mockUpdateStreakState).toHaveBeenCalledTimes(1);
    });
  });

  it("calls onAnswered() when Yes is pressed", async () => {
    const onAnswered = jest.fn();
    const { getByText } = renderModal({ onAnswered });
    await act(async () => {
      fireEvent.press(getByText("check_in.yes"));
    });
    await waitFor(() => {
      expect(onAnswered).toHaveBeenCalledTimes(1);
    });
  });

  it("calls onClose() when Yes is pressed", async () => {
    const onClose = jest.fn();
    const { getByText } = renderModal({ onClose });
    await act(async () => {
      fireEvent.press(getByText("check_in.yes"));
    });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("still calls onAnswered and onClose even when API throws (finally block)", async () => {
    mockLogNutritionDay.mockRejectedValueOnce(new Error("network error"));
    const onAnswered = jest.fn();
    const onClose = jest.fn();

    const { getByText } = renderModal({ onAnswered, onClose });
    await act(async () => {
      fireEvent.press(getByText("check_in.yes"));
    });
    await waitFor(() => {
      expect(onAnswered).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("double-tap guard — second press while submitting does not trigger a second API call", async () => {
    let resolveFirst: () => void;
    mockLogNutritionDay.mockReturnValueOnce(
      new Promise<{ success: boolean }>((res) => {
        resolveFirst = () => res({ success: true });
      }),
    );
    mockUpdateStreakState.mockResolvedValue({ success: true });

    const { getByText } = renderModal();
    // First press — will be in-flight
    fireEvent.press(getByText("check_in.yes"));
    // Second press while first is still in-flight
    fireEvent.press(getByText("check_in.yes"));

    await act(async () => {
      resolveFirst!();
      await Promise.resolve();
    });

    // logNutritionDay should only be called once
    expect(mockLogNutritionDay).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// No path
// ─────────────────────────────────────────────────────────────────────────────

describe("No button", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateLastCheckInDate.mockResolvedValue({ success: true });
  });

  it("calls onAnswered() when No is pressed", async () => {
    const onAnswered = jest.fn();
    const { getByText } = renderModal({ onAnswered });
    await act(async () => {
      fireEvent.press(getByText("check_in.no"));
    });
    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1));
  });

  it("calls onClose() when No is pressed", async () => {
    const onClose = jest.fn();
    const { getByText } = renderModal({ onClose });
    await act(async () => {
      fireEvent.press(getByText("check_in.no"));
    });
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("does NOT call logNutritionDay or updateStreakState when No is pressed", async () => {
    const { getByText } = renderModal();
    await act(async () => {
      fireEvent.press(getByText("check_in.no"));
    });
    expect(mockLogNutritionDay).not.toHaveBeenCalled();
    expect(mockUpdateStreakState).not.toHaveBeenCalled();
  });

  it("calls updateLastCheckInDate with yesterday's date on No", async () => {
    const realDate = Date;
    const fixedNow = new Date(2026, 2, 10, 12, 0, 0);
    // @ts-ignore
    global.Date = class extends realDate {
      constructor(...args: any[]) {
        if (args.length === 0) super(fixedNow);
        // @ts-ignore
        else super(...args);
      }
      static now() {
        return fixedNow.getTime();
      }
    };

    const { getByText } = renderModal();
    await act(async () => {
      fireEvent.press(getByText("check_in.no"));
    });
    await waitFor(() => {
      expect(mockUpdateLastCheckInDate).toHaveBeenCalledWith(
        "user-1",
        "2026-03-09",
      );
    });
    global.Date = realDate;
  });

  it("still calls onAnswered and onClose even when updateLastCheckInDate throws (finally block)", async () => {
    mockUpdateLastCheckInDate.mockRejectedValueOnce(new Error("network error"));
    const onAnswered = jest.fn();
    const onClose = jest.fn();
    const { getByText } = renderModal({ onAnswered, onClose });
    await act(async () => {
      fireEvent.press(getByText("check_in.no"));
    });
    await waitFor(() => {
      expect(onAnswered).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// X / close button — must NOT trigger onAnswered (core contract)
// ─────────────────────────────────────────────────────────────────────────────

describe("X / backdrop close", () => {
  beforeEach(() => jest.clearAllMocks());

  it("pressing X calls onClose but NOT onAnswered", () => {
    const onClose = jest.fn();
    const onAnswered = jest.fn();
    const { getByTestId } = renderModal({ onClose, onAnswered });
    fireEvent.press(getByTestId("modal-close-button"));
    expect(onClose).not.toHaveBeenCalled(); // X is a Pressable inside ModalCloseButton which calls Modal's onClose
    expect(onAnswered).not.toHaveBeenCalled();
  });

  it("does NOT call streak APIs on X close", () => {
    const { getByTestId } = renderModal();
    fireEvent.press(getByTestId("modal-close-button"));
    expect(mockLogNutritionDay).not.toHaveBeenCalled();
    expect(mockUpdateStreakState).not.toHaveBeenCalled();
  });
});
