import { supabase } from "@/util/supabase";

const toLocalDateKey = (value: string): string => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getUniqueSortedDateKeys = (values: string[]): string[] => {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
};

export const getMonthlyMealCompletionDates = async (
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<{ success: boolean; data?: string[]; error?: any }> => {
  console.log(
    `[streak-api] Fetching monthly completion dates for user=${userId} from ${fromDate} to ${toDate}`,
  );

  const { data, error } = await supabase
    .from("consumed_meals")
    .select("consumption_date")
    .eq("user_id", userId)
    .gte("consumption_date", fromDate)
    .lte("consumption_date", toDate)
    .order("consumption_date", { ascending: true });

  if (error) {
    console.error("[streak-api] Error fetching monthly completion dates:", error);
    return { success: false, error };
  }

  const uniqueDays = getUniqueSortedDateKeys(
    (data ?? []).map((item) => toLocalDateKey(item.consumption_date)),
  );

  console.log(
    `[streak-api] Monthly completion dates success. rows=${data?.length ?? 0}, uniqueDays=${uniqueDays.length}`,
  );

  return { success: true, data: uniqueDays };
};

export const getAllCompletionDatesUntilToday = async (
  userId: string,
): Promise<{ success: boolean; data?: string[]; error?: any }> => {
  const nowIso = new Date().toISOString();
  console.log(`[streak-api] Fetching all completion dates for user=${userId}`);

  const { data, error } = await supabase
    .from("consumed_meals")
    .select("consumption_date")
    .eq("user_id", userId)
    .lte("consumption_date", nowIso)
    .order("consumption_date", { ascending: true });

  if (error) {
    console.error("[streak-api] Error fetching all completion dates:", error);
    return { success: false, error };
  }

  const uniqueDays = getUniqueSortedDateKeys(
    (data ?? []).map((item) => toLocalDateKey(item.consumption_date)),
  );

  console.log(
    `[streak-api] All completion dates success. rows=${data?.length ?? 0}, uniqueDays=${uniqueDays.length}`,
  );

  return { success: true, data: uniqueDays };
};
