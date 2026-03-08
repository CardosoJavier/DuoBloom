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
// api/meals-api.ts
export const deleteConsumedMeal = async (
  mealId: string,
): Promise<{ success: boolean; error?: any }> => {
  console.log(`[meals-api] Delete flow started for meal: ${mealId}`);

  // 1) Read canonical photo path from DB first
  const { data: meal, error: fetchError } = await supabase
    .from("consumed_meals")
    .select("id, photo_url")
    .eq("id", mealId)
    .single();

  if (fetchError || !meal) {
    console.error(
      `[meals-api] Delete flow failed while fetching meal ${mealId}:`,
      fetchError,
    );
    return { success: false, error: fetchError ?? new Error("Meal not found") };
  }

  console.log(
    `[meals-api] Fetched meal ${mealId}. photo_url=${meal.photo_url || "null"}`,
  );

  // 2) Delete image first (if path exists)
  if (meal.photo_url) {
    // DB should store storage path, but guard against signed/external urls
    const isStoragePath = !meal.photo_url.startsWith("http");

    if (isStoragePath) {
      console.log(
        `[meals-api] Attempting storage delete for meal ${mealId}: ${meal.photo_url}`,
      );
      const { error: storageDeleteError } = await supabase.storage
        .from("user_media")
        .remove([meal.photo_url]);

      if (storageDeleteError) {
        console.error(
          `[meals-api] Storage delete failed for meal ${mealId}. Aborting DB delete:`,
          storageDeleteError,
        );
        return { success: false, error: storageDeleteError };
      }

      console.log(
        `[meals-api] Storage delete succeeded for meal ${mealId}: ${meal.photo_url}`,
      );
    } else {
      console.warn(
        `[meals-api] photo_url for meal ${mealId} is not a storage path. Skipping storage delete: ${meal.photo_url}`,
      );
    }
  } else {
    console.log(
      `[meals-api] Meal ${mealId} has no photo_url. Skipping storage delete.`,
    );
  }

  // 3) Delete DB row only after image deletion succeeded
  console.log(`[meals-api] Deleting DB row for meal ${mealId}...`);
  const { error: rowDeleteError } = await supabase
    .from("consumed_meals")
    .delete()
    .eq("id", mealId);

  if (rowDeleteError) {
    console.error(
      `[meals-api] DB row delete failed for meal ${mealId}:`,
      rowDeleteError,
    );
    return { success: false, error: rowDeleteError };
  }

  console.log(
    `[meals-api] Delete flow completed successfully for meal ${mealId}.`,
  );
  return { success: true };
};
