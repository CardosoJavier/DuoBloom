import { NutritionStreak } from "@/types/streaks";
import { supabase } from "@/util/supabase";

/**
 * Fetches nutrition streaks for a given user within a date range.
 * @param userId - The ID of the user to fetch streaks for.
 * @param fromDate - The start date of the range.
 * @param toDate - The end date of the range.
 */
export const getNutritionStreaks = async (
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<{ success: boolean; data?: NutritionStreak[]; error?: any }> => {
  const { data, error } = await supabase
    .from("nutrition_streaks")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", fromDate)
    .lte("log_date", toDate);

  if (error) {
    return { success: false, error };
  }

  return { success: true, data };
};

/**
 * Adds a new nutrition log for a specific day.
 * @param streak - The streak data to insert.
 */
export const addNutritionDay = async (
  streak: Omit<NutritionStreak, "id" | "created_at">,
): Promise<{ success: boolean; data?: NutritionStreak; error?: any }> => {
  const { data, error } = await supabase
    .from("nutrition_streaks")
    .insert([streak])
    .select()
    .single();

  if (error) {
    return { success: false, error };
  }

  return { success: true, data };
};
