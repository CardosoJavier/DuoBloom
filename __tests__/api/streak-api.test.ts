import {
  getMonthlyMealCompletionDates,
  getStreakState,
  logNutritionDay,
  recalculateStreak,
  updateStreakState,
} from "@/api/streak-api";
import { supabase } from "@/util/supabase";

// ─── Chainable Supabase mock ────────────────────────────────────────────────
// Each call returns `this` so the chain resolves to the last awaited value.

const mockChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
  upsert: jest.fn(),
  insert: jest.fn(),
  update: jest.fn().mockReturnThis(),
};

jest.mock("@/util/supabase", () => ({
  supabase: {
    from: jest.fn(() => mockChain),
    rpc: jest.fn(),
  },
}));

const mockFrom = supabase.from as jest.Mock;
const mockRpc = supabase.rpc as jest.Mock;

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeState = (overrides = {}) => ({
  id: "streak-id",
  user_id: "user-1",
  current_streak_count: 3,
  all_time_streak_count: 10,
  last_streak_day: "2026-03-09",
  last_updated_date: "2026-03-09T12:00:00Z",
  ...overrides,
});

beforeEach(() => {
  // resetAllMocks flushes unconsumed mockResolvedValueOnce queues too,
  // preventing stale queued values from bleeding into subsequent tests.
  jest.resetAllMocks();
  // Re-establish chain methods that must return `this` so the builder works.
  mockChain.select.mockReturnThis();
  mockChain.eq.mockReturnThis();
  mockChain.gte.mockReturnThis();
  mockChain.lte.mockReturnThis();
  mockChain.order.mockReturnThis();
  mockChain.update.mockReturnThis();
  mockFrom.mockReturnValue(mockChain);
});

// ─────────────────────────────────────────────────────────────────────────────
// getMonthlyMealCompletionDates
// ─────────────────────────────────────────────────────────────────────────────

describe("getMonthlyMealCompletionDates", () => {
  const userId = "user-1";
  const fromDate = "2026-03-01T00:00:00.000Z";
  const toDate = "2026-03-31T23:59:59.999Z";

  it("returns sorted date strings on success", async () => {
    mockChain.order.mockResolvedValueOnce({
      data: [{ log_date: "2026-03-05" }, { log_date: "2026-03-10" }],
      error: null,
    });

    const result = await getMonthlyMealCompletionDates(
      userId,
      fromDate,
      toDate,
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual(["2026-03-05", "2026-03-10"]);
    expect(mockFrom).toHaveBeenCalledWith("nutrition_logs");
    expect(mockChain.eq).toHaveBeenCalledWith("user_id", userId);
  });

  it("returns empty array when no logs exist", async () => {
    mockChain.order.mockResolvedValueOnce({ data: [], error: null });

    const result = await getMonthlyMealCompletionDates(
      userId,
      fromDate,
      toDate,
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns failure on DB error", async () => {
    const dbError = { message: "network error" };
    mockChain.order.mockResolvedValueOnce({ data: null, error: dbError });

    const result = await getMonthlyMealCompletionDates(
      userId,
      fromDate,
      toDate,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe(dbError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getStreakState
// ─────────────────────────────────────────────────────────────────────────────

describe("getStreakState", () => {
  const userId = "user-1";

  it("returns streak state row when it exists", async () => {
    const state = makeState();
    mockChain.maybeSingle.mockResolvedValueOnce({ data: state, error: null });

    const result = await getStreakState(userId);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(state);
    expect(mockFrom).toHaveBeenCalledWith("nutrition_streaks");
    expect(mockChain.eq).toHaveBeenCalledWith("user_id", userId);
  });

  it("returns null data when no row exists (first-time user)", async () => {
    mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await getStreakState(userId);

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  it("returns failure on DB error", async () => {
    const dbError = { message: "permission denied" };
    mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: dbError });

    const result = await getStreakState(userId);

    expect(result.success).toBe(false);
    expect(result.error).toBe(dbError);
    expect(result.data).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// logNutritionDay
// ─────────────────────────────────────────────────────────────────────────────

describe("logNutritionDay", () => {
  const userId = "user-1";
  const logDate = "2026-03-10";

  it("upserts the log and returns success", async () => {
    mockChain.upsert.mockResolvedValueOnce({ error: null });

    const result = await logNutritionDay(userId, logDate);

    expect(result.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("nutrition_logs");
    expect(mockChain.upsert).toHaveBeenCalledWith(
      { user_id: userId, log_date: logDate },
      { onConflict: "user_id,log_date", ignoreDuplicates: true },
    );
  });

  it("is idempotent — calling twice succeeds both times", async () => {
    mockChain.upsert
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });

    const r1 = await logNutritionDay(userId, logDate);
    const r2 = await logNutritionDay(userId, logDate);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
  });

  it("returns failure on DB error", async () => {
    const dbError = { message: "upsert failed" };
    mockChain.upsert.mockResolvedValueOnce({ error: dbError });

    const result = await logNutritionDay(userId, logDate);

    expect(result.success).toBe(false);
    expect(result.error).toBe(dbError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// recalculateStreak
// ─────────────────────────────────────────────────────────────────────────────

describe("recalculateStreak", () => {
  const userId = "user-1";

  it("calls RPC with correct p_user_id and returns success", async () => {
    mockRpc.mockResolvedValueOnce({ error: null });

    const result = await recalculateStreak(userId);

    expect(result.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("recalculate_nutrition_streak", {
      p_user_id: userId,
    });
  });

  it("returns failure when RPC errors", async () => {
    const rpcError = { message: "function not found" };
    mockRpc.mockResolvedValueOnce({ error: rpcError });

    const result = await recalculateStreak(userId);

    expect(result.success).toBe(false);
    expect(result.error).toBe(rpcError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateStreakState — 6 branches
// ─────────────────────────────────────────────────────────────────────────────

describe("updateStreakState", () => {
  const userId = "user-1";

  // Helper: set up maybeSingle to return a given state (or null)
  const stubState = (state: ReturnType<typeof makeState> | null) => {
    mockChain.maybeSingle.mockResolvedValueOnce({ data: state, error: null });
  };

  it("no existing row → inserts current=1, all_time=1", async () => {
    stubState(null); // getStreakState returns null
    mockChain.insert.mockResolvedValueOnce({ error: null });

    const result = await updateStreakState(userId, "2026-03-10");

    expect(result.success).toBe(true);
    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        current_streak_count: 1,
        all_time_streak_count: 1,
        last_streak_day: "2026-03-10",
      }),
    );
  });

  it("same day as last_streak_day → no-op (no DB write)", async () => {
    const state = makeState({ last_streak_day: "2026-03-10" });
    stubState(state);

    const result = await updateStreakState(userId, "2026-03-10");

    expect(result.success).toBe(true);
    expect(mockChain.insert).not.toHaveBeenCalled();
    expect(mockChain.update).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("retroactive date → delegates to recalculateStreak (RPC called, no direct update)", async () => {
    const state = makeState({ last_streak_day: "2026-03-09" });
    stubState(state);
    mockRpc.mockResolvedValueOnce({ error: null });

    // newLogDate is BEFORE last_streak_day
    const result = await updateStreakState(userId, "2026-03-05");

    expect(result.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("recalculate_nutrition_streak", {
      p_user_id: userId,
    });
    expect(mockChain.update).not.toHaveBeenCalled();
  });

  it("consecutive day (diff=1) → increments current, updates all_time when current exceeds it", async () => {
    const state = makeState({
      last_streak_day: "2026-03-09",
      current_streak_count: 3,
      all_time_streak_count: 3, // will be exceeded
    });
    stubState(state);
    // eq is called twice: once in getStreakState's select chain (must return mockChain so
    // maybeSingle can be reached), then once in update().eq() (terminal, returns resolved).
    mockChain.eq
      .mockReturnValueOnce(mockChain) // 1st call: getStreakState select chain
      .mockResolvedValueOnce({ error: null }); // 2nd call: update chain terminal

    const result = await updateStreakState(userId, "2026-03-10");

    expect(result.success).toBe(true);
    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        current_streak_count: 4,
        all_time_streak_count: 4,
        last_streak_day: "2026-03-10",
      }),
    );
  });

  it("consecutive day → all_time preserved when current does not exceed it", async () => {
    const state = makeState({
      last_streak_day: "2026-03-09",
      current_streak_count: 3,
      all_time_streak_count: 10, // well above current+1=4
    });
    stubState(state);
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: null });

    const result = await updateStreakState(userId, "2026-03-10");

    expect(result.success).toBe(true);
    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        current_streak_count: 4,
        all_time_streak_count: 10,
      }),
    );
  });

  it("gap (diff>1) → resets current to 1, all_time preserved", async () => {
    const state = makeState({
      last_streak_day: "2026-03-05",
      current_streak_count: 5,
      all_time_streak_count: 20,
    });
    stubState(state);
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: null });

    const result = await updateStreakState(userId, "2026-03-10");

    expect(result.success).toBe(true);
    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        current_streak_count: 1,
        all_time_streak_count: 20,
      }),
    );
  });

  it("DB error on update → returns failure", async () => {
    const state = makeState({
      last_streak_day: "2026-03-09",
      current_streak_count: 1,
      all_time_streak_count: 1,
    });
    stubState(state);
    const dbError = { message: "update failed" };
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: dbError });

    const result = await updateStreakState(userId, "2026-03-10");

    expect(result.success).toBe(false);
    expect(result.error).toBe(dbError);
  });

  it("getStreakState failure propagates without any write", async () => {
    const dbError = { message: "cannot read" };
    mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: dbError });

    const result = await updateStreakState(userId, "2026-03-10");

    expect(result.success).toBe(false);
    expect(mockChain.insert).not.toHaveBeenCalled();
    expect(mockChain.update).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Security assertions
// ─────────────────────────────────────────────────────────────────────────────

describe("security", () => {
  const userId = "user-abc-123";

  it("getMonthlyMealCompletionDates always filters by userId (.eq guard)", async () => {
    mockChain.order.mockResolvedValueOnce({ data: [], error: null });

    await getMonthlyMealCompletionDates(
      userId,
      "2026-03-01T00:00:00Z",
      "2026-03-31T23:59:59Z",
    );

    expect(mockChain.eq).toHaveBeenCalledWith("user_id", userId);
  });

  it("getStreakState always filters by userId (.eq guard)", async () => {
    mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await getStreakState(userId);

    expect(mockChain.eq).toHaveBeenCalledWith("user_id", userId);
  });

  it("updateStreakState update is scoped to exact userId — not a wildcard", async () => {
    const state = makeState({
      user_id: userId,
      last_streak_day: "2026-03-09",
    });
    mockChain.maybeSingle.mockResolvedValueOnce({ data: state, error: null });
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: null });

    await updateStreakState(userId, "2026-03-10");

    // The .eq("user_id", userId) scoping call must be present
    const eqCalls = mockChain.eq.mock.calls;
    const hasUserScope = eqCalls.some(
      ([col, val]) => col === "user_id" && val === userId,
    );
    expect(hasUserScope).toBe(true);
  });

  it("empty string userId — DB error is propagated, no silent success", async () => {
    const dbError = { message: "invalid input uuid" };
    mockChain.upsert.mockResolvedValueOnce({ error: dbError });

    const result = await logNutritionDay("", "2026-03-10");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("malformed date string — parseDateKey yields Invalid Date, treated as gap (current reset to 1, no crash)", async () => {
    const state = makeState({
      user_id: userId,
      last_streak_day: "2026-03-09",
      current_streak_count: 5,
      all_time_streak_count: 10,
    });
    mockChain.maybeSingle.mockResolvedValueOnce({ data: state, error: null });
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: null });

    // Should not throw — NaN diff falls into gap branch
    const result = await updateStreakState(userId, "not-a-date");

    expect(result.success).toBe(true);
    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ current_streak_count: 1 }),
    );
  });

  it("retroactive date never routes through the increment path (always via RPC)", async () => {
    const state = makeState({
      user_id: userId,
      last_streak_day: "2026-03-09",
      current_streak_count: 5,
    });
    mockChain.maybeSingle.mockResolvedValueOnce({ data: state, error: null });
    mockRpc.mockResolvedValueOnce({ error: null });

    await updateStreakState(userId, "2026-02-01");

    // Direct update must never be called for retroactive dates
    expect(mockChain.update).not.toHaveBeenCalled();
    expect(mockRpc).toHaveBeenCalledWith("recalculate_nutrition_streak", {
      p_user_id: userId,
    });
  });
});
