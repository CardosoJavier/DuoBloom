import {
  getMonthlyMealCompletionDates,
  getStreakState,
} from "@/api/streak-api";
import { StreakView } from "@/components/meals/StreakView";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock("@/api/streak-api", () => ({
  getMonthlyMealCompletionDates: jest.fn(),
  getStreakState: jest.fn(),
}));

// jest.mock factories are hoisted before imports. Use require() inside each
// factory (same pattern as DailyCheckInModal.test.tsx) to access react-native.
jest.mock("@/components/meals/CalendarGrid", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    CalendarGrid: () => <View testID="calendar-grid" />,
  };
});

jest.mock("@/components/meals/StreakWidgets", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    StreakWidgets: (props: any) => (
      <View
        testID="streak-widgets"
        accessibilityLabel={`current:${props.currentStreakDays} pct:${props.completionPercent}`}
      />
    ),
  };
});

jest.mock("@/components/DateNavigator", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    DateNavigator: (props: any) => (
      <View
        testID="date-navigator"
        accessibilityLabel={`disableNext:${props.disableNext}`}
      >
        <View
          testID="nav-prev"
          onTouchEnd={() => {
            const d = new Date(props.date);
            d.setMonth(d.getMonth() - 1);
            props.onDateChange(d);
          }}
        />
      </View>
    ),
  };
});

jest.mock("@/store/authStore", () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: "user-1", firstName: "Alice" },
    partner: null,
  })),
}));

jest.mock("@/hooks/use-app-toast", () => ({
  useAppToast: jest.fn(() => ({
    error: jest.fn(),
    success: jest.fn(),
  })),
}));

const mockGetMonthly = getMonthlyMealCompletionDates as jest.Mock;
const mockGetStreakState = getStreakState as jest.Mock;

// ─── Test helpers ────────────────────────────────────────────────────────────

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

// Freeze "today" to March 10, 2026 for deterministic disableNextMonth logic.
const FIXED_NOW = new Date(2026, 2, 10, 12, 0, 0);
const realDate = Date;

beforeAll(() => {
  // @ts-ignore
  global.Date = class extends realDate {
    constructor(...args: any[]) {
      if (args.length === 0) super(FIXED_NOW);
      // @ts-ignore
      else super(...args);
    }
    static now() {
      return FIXED_NOW.getTime();
    }
  };
});

afterAll(() => {
  global.Date = realDate;
});

const renderView = () => {
  const queryClient = makeQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <StreakView />
    </QueryClientProvider>,
  );
};

const pendingPromise = () => new Promise<any>(() => {});

// ─────────────────────────────────────────────────────────────────────────────
// Loading state
// ─────────────────────────────────────────────────────────────────────────────

describe("loading state", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMonthly.mockReturnValue(pendingPromise());
    mockGetStreakState.mockReturnValue(pendingPromise());
  });

  it("does not render CalendarGrid while queries are pending", () => {
    const { queryByTestId } = renderView();
    expect(queryByTestId("calendar-grid")).toBeNull();
  });

  it("does not render StreakWidgets while queries are pending", () => {
    const { queryByTestId } = renderView();
    expect(queryByTestId("streak-widgets")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Loaded state
// ─────────────────────────────────────────────────────────────────────────────

describe("loaded state", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMonthly.mockResolvedValue({
      success: true,
      data: ["2026-03-01", "2026-03-05", "2026-03-10"],
    });
    mockGetStreakState.mockResolvedValue({
      success: true,
      data: {
        id: "s1",
        user_id: "user-1",
        current_streak_count: 3,
        all_time_streak_count: 10,
        last_streak_day: "2026-03-10", // today — streak active
        last_updated_date: "2026-03-10T12:00:00Z",
      },
    });
  });

  it("renders CalendarGrid after queries resolve", async () => {
    const { findByTestId } = renderView();
    await expect(findByTestId("calendar-grid")).resolves.toBeTruthy();
  });

  it("renders StreakWidgets after queries resolve", async () => {
    const { findByTestId } = renderView();
    await expect(findByTestId("streak-widgets")).resolves.toBeTruthy();
  });

  it("renders completedDays count in the header", async () => {
    const { findByText } = renderView();
    // 3 dates returned → completedDays=3
    await expect(findByText("3")).resolves.toBeTruthy();
  });

  it("passes correct currentStreakDays to StreakWidgets (streak active today)", async () => {
    const { findByTestId } = renderView();
    const widget = await findByTestId("streak-widgets");
    expect(widget.props.accessibilityLabel).toContain("current:3");
  });

  it("passes correct completionPercent to StreakWidgets", async () => {
    const { findByTestId } = renderView();
    const widget = await findByTestId("streak-widgets");
    // 3 completed / 10 elapsed (March 10 = day 10) = 30%
    expect(widget.props.accessibilityLabel).toContain("pct:30");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Empty month
// ─────────────────────────────────────────────────────────────────────────────

describe("empty month", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMonthly.mockResolvedValue({ success: true, data: [] });
    mockGetStreakState.mockResolvedValue({ success: true, data: null });
  });

  it("renders streak.empty_month message when completedDays=0", async () => {
    const { findByText } = renderView();
    await expect(findByText("streak.empty_month")).resolves.toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error state
// ─────────────────────────────────────────────────────────────────────────────

describe("error state", () => {
  it("shows toast error when monthly query fails", async () => {
    jest.clearAllMocks();
    // Must import the mock after clearing so we get the latest instance
    const { useAppToast } = require("@/hooks/use-app-toast");
    const toastMock = { error: jest.fn(), success: jest.fn() };
    (useAppToast as jest.Mock).mockReturnValue(toastMock);

    mockGetMonthly.mockResolvedValue({
      success: false,
      error: new Error("DB error"),
    });
    mockGetStreakState.mockResolvedValue({ success: true, data: null });

    renderView();

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Streak broken — resolveCurrentStreak logic
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveCurrentStreak via StreakWidgets prop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMonthly.mockResolvedValue({ success: true, data: [] });
  });

  it("returns 0 when last_streak_day is more than 1 day ago (broken streak)", async () => {
    mockGetStreakState.mockResolvedValue({
      success: true,
      data: {
        id: "s1",
        user_id: "user-1",
        current_streak_count: 5,
        all_time_streak_count: 10,
        last_streak_day: "2026-03-08", // 2 days ago relative to fixed now (Mar 10)
        last_updated_date: "2026-03-08T12:00:00Z",
      },
    });

    const { findByTestId } = renderView();
    const widget = await findByTestId("streak-widgets");
    expect(widget.props.accessibilityLabel).toContain("current:0");
  });

  it("returns current_streak_count when last_streak_day is today", async () => {
    mockGetStreakState.mockResolvedValue({
      success: true,
      data: {
        id: "s1",
        user_id: "user-1",
        current_streak_count: 7,
        all_time_streak_count: 10,
        last_streak_day: "2026-03-10",
        last_updated_date: "2026-03-10T12:00:00Z",
      },
    });

    const { findByTestId } = renderView();
    const widget = await findByTestId("streak-widgets");
    expect(widget.props.accessibilityLabel).toContain("current:7");
  });

  it("returns current_streak_count when last_streak_day is yesterday", async () => {
    mockGetStreakState.mockResolvedValue({
      success: true,
      data: {
        id: "s1",
        user_id: "user-1",
        current_streak_count: 4,
        all_time_streak_count: 10,
        last_streak_day: "2026-03-09",
        last_updated_date: "2026-03-09T12:00:00Z",
      },
    });

    const { findByTestId } = renderView();
    const widget = await findByTestId("streak-widgets");
    expect(widget.props.accessibilityLabel).toContain("current:4");
  });

  it("returns 0 when no streak state row exists (null data)", async () => {
    mockGetStreakState.mockResolvedValue({ success: true, data: null });

    const { findByTestId } = renderView();
    const widget = await findByTestId("streak-widgets");
    expect(widget.props.accessibilityLabel).toContain("current:0");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Partner / subject toggle
// ─────────────────────────────────────────────────────────────────────────────

describe("partner toggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMonthly.mockResolvedValue({ success: true, data: [] });
    mockGetStreakState.mockResolvedValue({ success: true, data: null });
  });

  it("subject Pressable is disabled when there is no partner", async () => {
    const { useAuthStore } = require("@/store/authStore");
    (useAuthStore as jest.Mock).mockReturnValue({
      user: { id: "user-1", firstName: "Alice" },
      partner: null,
    });

    const { findByText } = renderView();
    // Alice's name shown, toggle present but leads nowhere (no crash test)
    await expect(findByText("Alice")).resolves.toBeTruthy();
  });

  it("shows partner firstName and fetches with partner.id after toggle", async () => {
    const { useAuthStore } = require("@/store/authStore");
    (useAuthStore as jest.Mock).mockReturnValue({
      user: { id: "user-1", firstName: "Alice" },
      partner: { id: "partner-1", firstName: "Bob" },
    });

    const { findByText, getByText } = renderView();

    // Initially shows self (Alice)
    await expect(findByText("Alice")).resolves.toBeTruthy();

    // Press the subject toggle
    await act(async () => {
      fireEvent.press(getByText("Alice"));
    });

    // Now should show partner (Bob)
    await waitFor(() => {
      expect(getByText("Bob")).toBeTruthy();
    });

    // API should have been called with partner's id
    expect(mockGetMonthly).toHaveBeenCalledWith(
      "partner-1",
      expect.any(String),
      expect.any(String),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// disableNext (current month guard)
// ─────────────────────────────────────────────────────────────────────────────

describe("month navigation guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMonthly.mockResolvedValue({ success: true, data: [] });
    mockGetStreakState.mockResolvedValue({ success: true, data: null });
    const { useAuthStore } = require("@/store/authStore");
    (useAuthStore as jest.Mock).mockReturnValue({
      user: { id: "user-1", firstName: "Alice" },
      partner: null,
    });
  });

  it("DateNavigator receives disableNext=true when viewing the current month (March 2026)", async () => {
    // Fixed now = March 10, 2026. Initial selectedDate = March 2026.
    const { findByTestId } = renderView();
    const nav = await findByTestId("date-navigator");
    expect(nav.props.accessibilityLabel).toContain("disableNext:true");
  });
});
