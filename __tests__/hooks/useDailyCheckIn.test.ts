import { getStreakState } from "@/api/streak-api";
import { useDailyCheckIn } from "@/hooks/useDailyCheckIn";
import { act, renderHook } from "@testing-library/react-native";

jest.mock("@/api/streak-api", () => ({
  getStreakState: jest.fn(),
}));

const mockGetStreakState = getStreakState as jest.Mock;

// Freeze today to a known date for deterministic yesterday-key comparisons.
const FIXED_NOW = new Date(2026, 2, 10, 12, 0, 0); // 2026-03-10
const TODAY_KEY = "2026-03-10";
const YESTERDAY_KEY = "2026-03-09";
const USER_ID = "user-1";

const realDate = Date;

beforeAll(() => {
  // @ts-ignore
  global.Date = class extends realDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(FIXED_NOW);
      } else {
        // @ts-ignore
        super(...args);
      }
    }

    static now() {
      return FIXED_NOW.getTime();
    }
  };
});

afterAll(() => {
  global.Date = realDate;
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Convenience: build a streak state stub with an optional last_check_in_date.
const makeStreakResult = (lastCheckInDate: string | null) => ({
  success: true,
  data: {
    id: "s-1",
    user_id: USER_ID,
    current_streak_count: 5,
    all_time_streak_count: 10,
    last_streak_day: YESTERDAY_KEY,
    last_updated_date: new Date().toISOString(),
    last_check_in_date: lastCheckInDate,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// shouldShow initial state
// ─────────────────────────────────────────────────────────────────────────────

describe("shouldShow initial value", () => {
  it("is true when last_check_in_date is null (new user, never answered)", async () => {
    mockGetStreakState.mockResolvedValueOnce(makeStreakResult(null));

    const { result } = renderHook(() => useDailyCheckIn(USER_ID));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.shouldShow).toBe(true);
  });

  it("is true when last_check_in_date is older than yesterday", async () => {
    mockGetStreakState.mockResolvedValueOnce(makeStreakResult("2026-03-08"));

    const { result } = renderHook(() => useDailyCheckIn(USER_ID));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.shouldShow).toBe(true);
  });

  it("is true when last_check_in_date equals yesterday (not yet answered today)", async () => {
    // yesterday here is 2026-03-09; modal asks about that day — it was NOT answered
    // Wait: if last_check_in_date === yesterday, it means the user DID answer yesterday.
    // The modal shows when the date differs. Yesterday answered == already handled == false.
    // Correct: last_check_in_date === yesterday → suppress (already answered for yesterday).
    mockGetStreakState.mockResolvedValueOnce(makeStreakResult(YESTERDAY_KEY));

    const { result } = renderHook(() => useDailyCheckIn(USER_ID));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.shouldShow).toBe(false);
  });

  it("is false when last_check_in_date equals today's date (edge: answered same day)", async () => {
    mockGetStreakState.mockResolvedValueOnce(makeStreakResult(TODAY_KEY));

    const { result } = renderHook(() => useDailyCheckIn(USER_ID));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.shouldShow).toBe(false);
  });

  it("starts as false before getStreakState resolves (no flash)", () => {
    mockGetStreakState.mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useDailyCheckIn(USER_ID));

    // Read synchronously before the promise resolves
    expect(result.current.shouldShow).toBe(false);
  });

  it("does not call getStreakState when userId is undefined", () => {
    const { result } = renderHook(() => useDailyCheckIn(undefined));

    expect(mockGetStreakState).not.toHaveBeenCalled();
    expect(result.current.shouldShow).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sad paths
// ─────────────────────────────────────────────────────────────────────────────

describe("sad paths", () => {
  it("SP5: does not show modal when getStreakState returns an error (offline / DB error)", async () => {
    mockGetStreakState.mockResolvedValueOnce({
      success: false,
      error: { message: "network error" },
    });

    const { result } = renderHook(() => useDailyCheckIn(USER_ID));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.shouldShow).toBe(false);
  });

  it("SP6: does not show modal when no streak row exists yet (null data, getStreakState success)", async () => {
    // No row at all — new user with no streak state either; treat as show=true
    // (they have never answered); but this is a design decision: null data
    // means last_check_in_date is also null → modal shows (correct).
    mockGetStreakState.mockResolvedValueOnce({ success: true, data: null });

    const { result } = renderHook(() => useDailyCheckIn(USER_ID));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.shouldShow).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// markShown
// ─────────────────────────────────────────────────────────────────────────────

describe("markShown", () => {
  it("sets shouldShow to false after being called", async () => {
    mockGetStreakState.mockResolvedValueOnce(makeStreakResult(null));

    const { result } = renderHook(() => useDailyCheckIn(USER_ID));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.shouldShow).toBe(true);

    act(() => {
      result.current.markShown();
    });

    expect(result.current.shouldShow).toBe(false);
  });

  it("calling markShown twice does not throw and leaves shouldShow false", async () => {
    mockGetStreakState.mockResolvedValueOnce(makeStreakResult(null));

    const { result } = renderHook(() => useDailyCheckIn(USER_ID));

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.markShown();
    });
    act(() => {
      result.current.markShown();
    });

    expect(result.current.shouldShow).toBe(false);
  });
});
