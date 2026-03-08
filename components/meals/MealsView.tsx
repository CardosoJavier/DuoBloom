import { addConsumedMeal, getConsumedMeals } from "@/api/meals-api";
import { Box } from "@/components/ui/box";
import { Fab, FabIcon } from "@/components/ui/fab";
import { Text } from "@/components/ui/text";
import { useAppToast } from "@/hooks/use-app-toast";
import { useAuthStore } from "@/store/authStore";
import { ConsumedMeal } from "@/types/meals";
import { supabase } from "@/util/supabase";
import * as Crypto from "expo-crypto";
import { Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { DateNavigator } from "../DateNavigator";
import { IdentifiedImage } from "../IdentifiedImage";
import { AddMealModal } from "./AddMealModal";
import { EditMealModal } from "./EditMealModal";

export function MealsView() {
  const { t } = useTranslation();
  const { user, partner } = useAuthStore();
  const toast = useAppToast();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<ConsumedMeal | null>(null);
  const [meals, setMeals] = useState<ConsumedMeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMeals();
  }, [selectedDate, user?.id]);

  const fetchMeals = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    console.log("[MealsView] fetchMeals started for date:", selectedDate);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log("[MealsView] Calling getConsumedMeals...");
    const result = await getConsumedMeals(
      startOfDay.toISOString(),
      endOfDay.toISOString(),
    );

    if (result.success && result.data) {
      const records = result.data;
      console.log(
        `[MealsView] Got ${records.length} meals. Processing signed URLs...`,
      );

      const mealsWithSignedUrls: ConsumedMeal[] = await Promise.all(
        records.map(async (meal) => {
          if (!meal.photo_url || meal.photo_url.startsWith("http")) {
            return meal;
          }

          console.log(
            `[MealsView] Creating signed URL for path: ${meal.photo_url}`,
          );
          const { data, error } = await supabase.storage
            .from("user_media")
            .createSignedUrl(meal.photo_url, 3600);

          if (error) {
            console.error(
              `[MealsView] Error creating signed URL for ${meal.photo_url}:`,
              error,
            );
          }

          return {
            ...meal,
            photo_url: data?.signedUrl || meal.photo_url,
          };
        }),
      );

      console.log(`[MealsView] Finished processing signed URLs.`);
      setMeals(mealsWithSignedUrls);
    } else {
      console.warn(
        "[MealsView] Failed to fetch meals or no data.",
        result.error,
      );
      setMeals([]);
    }

    setIsLoading(false);
  };

  const handleAddMeal = async (mealInfo: {
    name: string;
    calories: number;
    uri: string;
  }) => {
    if (!user?.id || !mealInfo.uri) return;

    setIsLoading(true);
    console.log("[MealsView] handleAddMeal started for:", mealInfo.name);

    try {
      // 1. Generate path
      const uuid = Crypto.randomUUID();
      const path = `meals/${user.id}/${uuid}.jpg`;
      console.log("[MealsView] Generated storage path:", path);

      // 2. Request Signed Upload URL
      console.log("[MealsView] Requesting signed upload URL...");
      const { data: uploadUrlData, error: uploadUrlError } =
        await supabase.storage.from("user_media").createSignedUploadUrl(path);

      if (uploadUrlError || !uploadUrlData) {
        console.error(
          "[MealsView] Error getting signed upload URL:",
          uploadUrlError,
        );
        toast.error(t("common.error"), t("meals.upload_url_error"));
        setIsLoading(false);
        return;
      }
      console.log("[MealsView] Got signed upload URL successfully.");

      // 3. Upload to Storage
      console.log("[MealsView] Uploading file to storage...");
      // Bypass ArrayBuffer base64 conversion.
      // Use FormData to leverage React Native's native fetch payload handling
      const formData = new FormData();
      formData.append("file", {
        uri: mealInfo.uri,
        name: `${uuid}.jpg`,
        type: "image/jpeg",
      } as any);

      const { error: uploadError } = await supabase.storage
        .from("user_media")
        .uploadToSignedUrl(path, uploadUrlData.token, formData);

      if (uploadError) {
        console.error("[MealsView] Error uploading to storage:", uploadError);
        toast.error(t("common.error"), t("meals.upload_failed"));
        setIsLoading(false);
        return;
      }
      console.log("[MealsView] File uploaded to storage successfully.");

      // 4. Database Persistence
      console.log("[MealsView] Persisting meal to database...");
      try {
        const result = await addConsumedMeal({
          user_id: user.id,
          name: mealInfo.name,
          kcal: mealInfo.calories,
          consumption_date: new Date().toISOString(),
          photo_url: path, // Only store the path
        });

        if (!result.success) {
          throw new Error(result.error?.message || "DB Save Failed");
        }
        console.log("[MealsView] Meal persisted to database successfully.");
      } catch (dbError) {
        // 5. Rollback Logic
        console.error(
          "[MealsView] Database error. Rolling back storage file...",
          dbError,
        );
        await supabase.storage.from("user_media").remove([path]);
        console.log("[MealsView] Storage rollback complete.");
        toast.error(t("common.error"), t("meals.db_save_failed"));
        setIsLoading(false);
        return;
      }

      console.log(
        "[MealsView] Meal added successfully. Refreshing meals list...",
      );
      await fetchMeals();
    } catch (e: any) {
      console.error("[MealsView] Unexpected error in handleAddMeal:", e);
      toast.error(t("common.error"), e.message || "Unknown error");
      setIsLoading(false);
    }
  };

  const getAvatarForUser = (userId: string) => {
    if (userId === user?.id) {
      return (
        user?.avatarUrl ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&q=80"
      ); // Fallback User Avatar
    }
    if (userId === partner?.id) {
      return (
        partner?.avatarUrl ||
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80"
      ); // Fallback Partner Avatar
    }
    return undefined;
  };

  const userMeals = meals.filter((m) => m.user_id === user?.id);
  const partnerMeals = meals.filter((m) => m.user_id === partner?.id);

  const renderMealsContent = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" className="mt-10" />;
    }

    if (meals.length === 0) {
      return (
        <Text className="text-typography-500 w-full text-center mt-10">
          {t("meals.no_meals_found_today")}
        </Text>
      );
    }

    return (
      <View className="flex-row flex-wrap justify-between">
        {meals.map((meal) => (
          <View key={meal.id} className="w-[48%] mb-4">
            <Pressable
              onPress={() => {
                if (meal.user_id === user?.id) {
                  console.log(
                    "[MealsView] Opening edit modal for meal:",
                    meal.id,
                  );
                  setSelectedMeal(meal);
                  setIsEditModalOpen(true);
                }
              }}
            >
              <IdentifiedImage
                uri={meal.photo_url}
                avatarUri={getAvatarForUser(meal.user_id)}
                title={meal.name}
                subtitle={`${meal.kcal || 0} kcal | ${new Date(
                  meal.consumption_date,
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
              />
            </Pressable>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Box className="flex-1 bg-background-0 relative">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <DateNavigator
          date={selectedDate}
          onDateChange={(newDate) => setSelectedDate(newDate)}
          className="mb-8"
        />

        <Text
          size="xl"
          className="font-bold text-typography-900 dark:text-white mb-4"
        >
          {t("meals.shared_meals")}
        </Text>

        {renderMealsContent()}

        {!isLoading && meals.length > 0 && partner && (
          <View className="w-full mt-6 gap-4">
            {userMeals.length === 0 && (
              <Box className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <Text className="text-typography-500 text-center">
                  {t("meals.user_no_meals")}
                </Text>
              </Box>
            )}
            {partnerMeals.length === 0 && (
              <Box className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <Text className="text-typography-500 text-center">
                  {t("meals.partner_no_meals", {
                    name: partner.firstName,
                  })}
                </Text>
              </Box>
            )}
          </View>
        )}
      </ScrollView>

      <Fab
        size="lg"
        placement="bottom right"
        className="bg-primary-500 hover:bg-primary-600 active:bg-primary-700 shadow-lg absolute bottom-6 right-6"
        onPress={() => setIsModalOpen(true)}
      >
        <FabIcon as={Plus} className="text-white" />
      </Fab>

      <AddMealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddMeal}
      />

      <EditMealModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMeal(null);
        }}
        meal={selectedMeal}
        onSuccess={fetchMeals}
      />
    </Box>
  );
}
