import { addConsumedMeal, getConsumedMeals } from "@/api/meals-api";
import { Box } from "@/components/ui/box";
import { Fab, FabIcon } from "@/components/ui/fab";
import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/store/authStore";
import { ConsumedMeal } from "@/types/meals";
import { supabase } from "@/util/supabase";
import { Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { DateNavigator } from "../DateNavigator";
import { IdentifiedImage } from "../IdentifiedImage";
import { AddMealModal } from "./AddMealModal";

export function MealsView() {
  const { t } = useTranslation();
  const { user, partner } = useAuthStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meals, setMeals] = useState<ConsumedMeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMeals();
  }, [selectedDate, user?.id]);

  const fetchMeals = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await getConsumedMeals(
      startOfDay.toISOString(),
      endOfDay.toISOString(),
    );

    if (result.success && result.data) {
      setMeals(result.data);
    } else {
      setMeals([]);
    }

    setIsLoading(false);
  };

  const handleAddMeal = async (mealInfo: {
    name: string;
    calories: number;
    uri: string;
  }) => {
    if (!user?.id) return;

    setIsLoading(true);
    await addConsumedMeal({
      user_id: user.id,
      name: mealInfo.name,
      kcal: mealInfo.calories,
      consumption_date: new Date().toISOString(),
      photo_url: mealInfo.uri,
    });

    await fetchMeals();
  };

  const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const { data } = supabase.storage.from("meals").getPublicUrl(path);
    return data.publicUrl;
  };

  const getAvatarForUser = (userId: string) => {
    if (userId === user?.id) {
      return (
        user?.avatarUrl ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&q=80"
      ); // Fallback User Avatar
    }
    if (partner && userId === partner.id) {
      return (
        partner?.avatarUrl ||
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80"
      ); // Fallback Partner Avatar
    }
    return undefined;
  };

  const userMeals = meals.filter((m) => m.user_id === user?.id);
  const partnerMeals = meals.filter((m) => m.user_id === partner?.id);

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

        {isLoading ? (
          <ActivityIndicator size="large" className="mt-10" />
        ) : meals.length === 0 ? (
          <Text className="text-typography-500 w-full text-center mt-10">
            {t("meals.no_meals_found_today")}
          </Text>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {meals.map((meal) => (
              <View key={meal.id} className="w-[48%] mb-4">
                <IdentifiedImage
                  uri={getImageUrl(meal.photo_url)}
                  avatarUri={getAvatarForUser(meal.user_id)}
                  title={meal.name}
                  subtitle={`${meal.kcal || 0} kcal | ${new Date(
                    meal.consumption_date,
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
                />
              </View>
            ))}
          </View>
        )}

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
    </Box>
  );
}
