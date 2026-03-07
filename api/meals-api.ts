import { ConsumedMeal } from "@/types/meals";
import { supabase } from "@/util/supabase";

/**
 * Fetches consumed meals for the logged-in user and their partner.
 * @param fromDate - The start date of the range.
 * @param toDate - The end date of the range.
 */
export const getConsumedMeals = async (
  fromDate: string,
  toDate: string,
): Promise<{ success: boolean; data?: ConsumedMeal[]; error?: any }> => {
  console.log(
    `[meals-api] Fetching consumed meals from ${fromDate} to ${toDate}`,
  );
  const { data, error } = await supabase
    .from("consumed_meals")
    .select("*")
    .gte("consumption_date", fromDate)
    .lte("consumption_date", toDate);

  if (error) {
    console.error(`[meals-api] Error fetching consumed meals:`, error);
    return { success: false, error };
  }

  console.log(`[meals-api] Fetched ${data?.length || 0} meals successfully.`);
  return { success: true, data };
};

/**
 * Adds a new consumed meal for the logged-in user.
 * @param meal - The meal data to insert.
 */
export const addConsumedMeal = async (
  meal: Omit<ConsumedMeal, "id" | "created_at" | "updated_at" | "user_id"> & {
    user_id: string;
  },
): Promise<{ success: boolean; data?: ConsumedMeal; error?: any }> => {
  console.log(`[meals-api] Adding consumed meal:`, meal);
  const { data, error } = await supabase
    .from("consumed_meals")
    .insert([meal])
    .select()
    .single();

  if (error) {
    console.error(`[meals-api] Error adding consumed meal:`, error);
    return { success: false, error };
  }

  console.log(`[meals-api] Successfully added meal with ID:`, data.id);
  return { success: true, data };
};

/**
 * Updates a consumed meal for the logged-in user.
 * @param mealId - The ID of the meal to update.
 * @param updatedFields - The fields to update.
 */
export const updateConsumedMeal = async (
  mealId: string,
  updatedFields: Partial<
    Omit<ConsumedMeal, "id" | "created_at" | "updated_at" | "user_id">
  >,
): Promise<{ success: boolean; data?: ConsumedMeal; error?: any }> => {
  console.log(
    `[meals-api] Updating consumed meal ${mealId} with:`,
    updatedFields,
  );
  const { data, error } = await supabase
    .from("consumed_meals")
    .update(updatedFields)
    .eq("id", mealId)
    .select()
    .single();

  if (error) {
    console.error(`[meals-api] Error updating consumed meal:`, error);
    return { success: false, error };
  }

  console.log(`[meals-api] Successfully updated meal ${mealId}.`);
  return { success: true, data };
};

/**
 * Deletes a consumed meal for the logged-in user.
 * @param mealId - The ID of the meal to delete.
 */
export const deleteConsumedMeal = async (
  mealId: string,
): Promise<{ success: boolean; error?: any }> => {
  console.log(`[meals-api] Deleting consumed meal: ${mealId}`);
  const { error } = await supabase
    .from("consumed_meals")
    .delete()
    .eq("id", mealId);

  if (error) {
    console.error(`[meals-api] Error deleting consumed meal:`, error);
    return { success: false, error };
  }

  console.log(`[meals-api] Successfully deleted meal ${mealId}.`);
  return { success: true };
};
