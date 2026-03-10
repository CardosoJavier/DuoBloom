import { NutritionStreakState } from "@/types/streaks";
import { supabase } from "@/util/supabase";

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Converts a YYYY-MM-DD string to a Date at midnight local time (avoids UTC off-by-one). */
const parseDateKey = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const daysBetween = (a: Date, b: Date): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const aDay = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bDay = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bDay.getTime() - aDay.getTime()) / msPerDay);
};

// ─── Monthly calendar data (nutrition_logs) ────────────────────────────────

export const getMonthlyMealCompletionDates = async (
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<{ success: boolean; data?: string[]; error?: any }> => {
  const fromDateKey = toLocalDateString(new Date(fromDate));
  const toDateKey = toLocalDateString(new Date(toDate));

  console.log(
    `[streak-api] Fetching monthly completion dates for user=${userId} from ${fromDateKey} to ${toDateKey}`,
  );

  const { data, error } = await supabase
    .from("nutrition_logs")
    .select("log_date")
    .eq("user_id", userId)
    .gte("log_date", fromDateKey)
    .lte("log_date", toDateKey)
    .order("log_date", { ascending: true });

  if (error) {
    console.error(
      "[streak-api] Error fetching monthly completion dates:",
      error,
    );
    return { success: false, error };
  }

  const days = (data ?? []).map((item) => item.log_date as string);
  console.log(
    `[streak-api] Monthly completion dates success. rows=${days.length}`,
  );
  return { success: true, data: days };
};

// ─── Streak state (nutrition_streaks) ──────────────────────────────────────

/** Reads the streak state row for a user. Returns null data if no row exists yet. */
export const getStreakState = async (
  userId: string,
): Promise<{
  success: boolean;
  data?: NutritionStreakState | null;
  error?: any;
}> => {
  console.log(`[streak-api] Fetching streak state for user=${userId}`);

  const { data, error } = await supabase
    .from("nutrition_streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[streak-api] Error fetching streak state:", error);
    return { success: false, error };
  }

  return { success: true, data: data as NutritionStreakState | null };
};

// ─── Nutrition log write (idempotent) ──────────────────────────────────────

/**
 * Records that the user logged meals on a given date.
 * Safe to call on every meal add — the UNIQUE(user_id, log_date) constraint
 * means duplicates are silently ignored.
 */
export const logNutritionDay = async (
  userId: string,
  logDate: string,
): Promise<{ success: boolean; error?: any }> => {
  console.log(
    `[streak-api] Logging nutrition day userId=${userId} date=${logDate}`,
  );

  const { error } = await supabase
    .from("nutrition_logs")
    .upsert(
      { user_id: userId, log_date: logDate },
      { onConflict: "user_id,log_date", ignoreDuplicates: true },
    );

  if (error) {
    console.error("[streak-api] Error logging nutrition day:", error);
    return { success: false, error };
  }

  return { success: true };
};

// ─── Streak state update (client-side logic) ───────────────────────────────

/**
 * Updates the streak state for a user after a meal log.
 * Call this immediately after logNutritionDay.
 *
 * Rules:
 *  - No existing row → create with current=1, all_time=1
 *  - Same day as last_streak_day → no-op
 *  - newLogDate < last_streak_day (retroactive) → delegate to DB recalculation
 *  - newLogDate = last_streak_day + 1 day (consecutive) → increment current
 *  - newLogDate > last_streak_day + 1 day (gap) → reset current to 1
 *  - all_time is updated if current > all_time
 */
export const updateStreakState = async (
  userId: string,
  newLogDate: string,
): Promise<{ success: boolean; error?: any }> => {
  console.log(
    `[streak-api] Updating streak state userId=${userId} newLogDate=${newLogDate}`,
  );

  const stateResult = await getStreakState(userId);
  if (!stateResult.success) {
    return { success: false, error: stateResult.error };
  }

  const existing = stateResult.data;
  const newDate = parseDateKey(newLogDate);

  // ── No existing row ────────────────────────────────────────────────────
  if (!existing) {
    const { error } = await supabase.from("nutrition_streaks").insert({
      user_id: userId,
      current_streak_count: 1,
      all_time_streak_count: 1,
      last_streak_day: newLogDate,
    });
    if (error) {
      console.error("[streak-api] Error creating streak state row:", error);
      return { success: false, error };
    }
    console.log("[streak-api] Streak state created (first log).");
    return { success: true };
  }

  // ── Same day — already counted ─────────────────────────────────────────
  if (existing.last_streak_day === newLogDate) {
    console.log("[streak-api] Same day log — streak state unchanged.");
    return { success: true };
  }

  // ── Retroactive log — recalculate from scratch via DB function ─────────
  if (existing.last_streak_day && newLogDate < existing.last_streak_day) {
    console.log(
      "[streak-api] Retroactive log detected — triggering full recalculation.",
    );
    return recalculateStreak(userId);
  }

  // ── Forward log — apply consecutive / gap logic ────────────────────────
  const lastDate = existing.last_streak_day
    ? parseDateKey(existing.last_streak_day)
    : null;

  const diff = lastDate ? daysBetween(lastDate, newDate) : null;
  let newCurrent: number;

  if (diff === 1) {
    // Consecutive day
    newCurrent = existing.current_streak_count + 1;
  } else {
    // Gap (diff > 1 or no previous date after the no-existing-row guard above)
    newCurrent = 1;
  }

  const newAllTime = Math.max(existing.all_time_streak_count, newCurrent);

  const { error } = await supabase
    .from("nutrition_streaks")
    .update({
      current_streak_count: newCurrent,
      all_time_streak_count: newAllTime,
      last_streak_day: newLogDate,
      last_updated_date: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("[streak-api] Error updating streak state:", error);
    return { success: false, error };
  }

  console.log(
    `[streak-api] Streak state updated. current=${newCurrent} allTime=${newAllTime}`,
  );
  return { success: true };
};

// ─── Full DB recalculation ─────────────────────────────────────────────────

/**
 * Calls the recalculate_nutrition_streak Postgres function.
 * Used for retroactive log inserts where client-side logic is insufficient.
 */
export const recalculateStreak = async (
  userId: string,
): Promise<{ success: boolean; error?: any }> => {
  console.log(
    `[streak-api] Calling recalculate_nutrition_streak for user=${userId}`,
  );

  const { error } = await supabase.rpc("recalculate_nutrition_streak", {
    p_user_id: userId,
  });

  if (error) {
    console.error("[streak-api] Error recalculating streak:", error);
    return { success: false, error };
  }

  console.log(`[streak-api] Streak recalculation complete for user=${userId}`);
  return { success: true };
};
