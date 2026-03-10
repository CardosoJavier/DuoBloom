import { useDailyCheckIn } from "@/hooks/useDailyCheckIn";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook } from "@testing-library/react-native";

// AsyncStorage is already mocked globally in jest-setup.ts via the official mock.
// We cast it for type-safe jest method access.
const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// Freeze today to a known date for deterministic storage key comparisons.
const FIXED_NOW = new Date(2026, 2, 10, 12, 0, 0); // 2026-03-10
const TODAY_KEY = "2026-03-10";
const YESTERDAY_KEY = "2026-03-09";

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

const STORAGE_KEY = "daily_check_in_last_shown";

// ─────────────────────────────────────────────────────────────────────────────
// shouldShow initial state
// ─────────────────────────────────────────────────────────────────────────────

describe("shouldShow initial value", () => {
  it("is true when AsyncStorage has no stored value (first launch)", async () => {
    mockStorage.getItem.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useDailyCheckIn());

    await act(async () => {
      // Allow the useEffect promise to resolve
      await Promise.resolve();
    });

    expect(result.current.shouldShow).toBe(true);
  });

  it("is true when stored value is a past date", async () => {
    mockStorage.getItem.mockResolvedValueOnce(YESTERDAY_KEY);

    const { result } = renderHook(() => useDailyCheckIn());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.shouldShow).toBe(true);
  });

  it("is false when stored value equals today (already answered today)", async () => {
    mockStorage.getItem.mockResolvedValueOnce(TODAY_KEY);

    const { result } = renderHook(() => useDailyCheckIn());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.shouldShow).toBe(false);
  });

  it("starts as false before AsyncStorage resolves (default initial state)", () => {
    // getItem is never resolved in this test — we read state synchronously
    mockStorage.getItem.mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useDailyCheckIn());

    // Before the promise resolves, shouldShow must be false (don't flash modal)
    expect(result.current.shouldShow).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// markShown
// ─────────────────────────────────────────────────────────────────────────────

describe("markShown", () => {
  it("writes today's date string to AsyncStorage", async () => {
    mockStorage.getItem.mockResolvedValueOnce(null);
    mockStorage.setItem.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useDailyCheckIn());

    await act(async () => {
      await Promise.resolve(); // resolve getItem
    });

    await act(async () => {
      await result.current.markShown();
    });

    expect(mockStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, TODAY_KEY);
  });

  it("sets shouldShow to false after being called", async () => {
    mockStorage.getItem.mockResolvedValueOnce(null);
    mockStorage.setItem.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useDailyCheckIn());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.shouldShow).toBe(true); // verify it was true first

    await act(async () => {
      await result.current.markShown();
    });

    expect(result.current.shouldShow).toBe(false);
  });

  it("calling markShown twice does not throw", async () => {
    mockStorage.getItem.mockResolvedValueOnce(null);
    mockStorage.setItem.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDailyCheckIn());

    await act(async () => {
      await Promise.resolve();
    });

    // Both calls must resolve without throwing and leave shouldShow=false.
    await act(async () => {
      await result.current.markShown();
    });
    await act(async () => {
      await result.current.markShown();
    });

    expect(result.current.shouldShow).toBe(false);
  });
});
