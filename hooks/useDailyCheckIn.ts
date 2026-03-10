import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const STORAGE_KEY = "daily_check_in_last_shown";

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface UseDailyCheckInResult {
  shouldShow: boolean;
  markShown: () => Promise<void>;
}

/**
 * Returns whether the daily nutrition check-in modal should be shown today.
 * Reads/writes an AsyncStorage key to ensure the modal is displayed at most
 * once per calendar day (local timezone).
 */
export function useDailyCheckIn(): UseDailyCheckInResult {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const today = toLocalDateString(new Date());
      if (stored !== today) {
        setShouldShow(true);
      }
    });
  }, []);

  const markShown = async (): Promise<void> => {
    const today = toLocalDateString(new Date());
    await AsyncStorage.setItem(STORAGE_KEY, today);
    setShouldShow(false);
  };

  return { shouldShow, markShown };
}
