import { supabase } from "@/util/supabase";

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
    .from("nutrition_streaks")
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

export const getAllCompletionDatesUntilToday = async (
  userId: string,
): Promise<{ success: boolean; data?: string[]; error?: any }> => {
  const todayKey = toLocalDateString(new Date());
  console.log(`[streak-api] Fetching all completion dates for user=${userId}`);

  const { data, error } = await supabase
    .from("nutrition_streaks")
    .select("log_date")
    .eq("user_id", userId)
    .lte("log_date", todayKey)
    .order("log_date", { ascending: true });

  if (error) {
    console.error("[streak-api] Error fetching all completion dates:", error);
    return { success: false, error };
  }

  const days = (data ?? []).map((item) => item.log_date as string);

  console.log(`[streak-api] All completion dates success. rows=${days.length}`);

  return { success: true, data: days };
};
