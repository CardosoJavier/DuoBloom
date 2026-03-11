import { getStreakState } from "@/api/streak-api";
import { useEffect, useState } from "react";

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayKey = (): string => toLocalDateString(new Date());

const getYesterdayKey = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
};

interface UseDailyCheckInResult {
  shouldShow: boolean;
  markShown: () => void;
}

/**
 * Returns whether the daily nutrition check-in modal should be shown.
 * Reads last_check_in_date from the nutrition_streaks row so the decision
 * is consistent across all devices for the same user.
 *
 * Show the modal when last_check_in_date is neither today nor yesterday:
 *   - null (new user, never answered)
 *   - any date older than yesterday (hasn't been asked in the current window)
 *
 * markShown() only updates local state — the actual DB write is handled by
 * DailyCheckInModal after the user answers (Yes or No).
 */
export function useDailyCheckIn(
  userId: string | undefined,
): UseDailyCheckInResult {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!userId) return;

    getStreakState(userId).then((result) => {
      if (!result.success) {
        return;
      }

      const today = getTodayKey();
      const yesterday = getYesterdayKey();
      const lastCheckIn = result.data?.last_check_in_date ?? null;

      if (lastCheckIn !== yesterday && lastCheckIn !== today) {
        setShouldShow(true);
      }
    });
  }, []);

  const markShown = (): void => {
    setShouldShow(false);
  };

  return { shouldShow, markShown };
}
