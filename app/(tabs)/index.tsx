import { progressApi } from "@/api/progress-api";
import { HydrationWidget } from "@/components/today/HydrationWidget";
import { MealsSummaryWidget } from "@/components/today/MealsSummaryWidget";
import { NutritionStreakCard } from "@/components/today/NutritionStreakCard";
import { WeightTrendWidget } from "@/components/today/WeightTrendWidget";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/store/authStore";
import { UnitSystem } from "@/types/user";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TodayScreen() {
  const { t } = useTranslation();
  const { user, partner } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["user-settings", user?.id],
    queryFn: () => progressApi.getSettings(user!.id),
    enabled: !!user?.id,
    select: (r) => r.data,
  });

  const unitSystem: UnitSystem = settings?.preferredUnitSystem ?? "KG";

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      queryClient.invalidateQueries({ queryKey: ["streak-monthly", user.id] });
      queryClient.invalidateQueries({ queryKey: ["today-meals", user.id] });
      queryClient.invalidateQueries({
        queryKey: ["stats-summary", user.id, "weight"],
      });
      if (partner?.id) {
        queryClient.invalidateQueries({
          queryKey: ["stats-summary", partner.id, "weight"],
        });
      }
    }, [user?.id, partner?.id, queryClient]),
  );

  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack className="p-4 gap-5">
          {/* Greeting */}
          <VStack className="gap-1 mt-2">
            <Text className="text-typography-900 dark:text-white font-bold text-3xl">
              {t("today.greeting", { name: user?.firstName ?? "" })} 👋
            </Text>
            <Text className="text-typography-500 text-sm">{dateStr}</Text>
          </VStack>

          {/* Nutrition Streak with embedded CalendarGrid */}
          <NutritionStreakCard />

          {/* Hydration + Meals row */}
          <HStack className="gap-4">
            <HydrationWidget />
            <MealsSummaryWidget />
          </HStack>

          {/* My Trend + Partner Trend row */}
          <HStack className="gap-4">
            <WeightTrendWidget
              userId={user?.id ?? ""}
              label={t("today.my_trend")}
              unitSystem={unitSystem}
              chartColor="#6366f1"
            />
            {partner ? (
              <WeightTrendWidget
                userId={partner.id}
                label={partner.firstName ?? t("today.partner")}
                unitSystem={unitSystem}
                chartColor="#ec4899"
              />
            ) : (
              <Box
                className="flex-1 rounded-[32px] border border-outline-100 dark:border-outline-800 bg-background-0 dark:bg-background-dark p-5 items-center justify-center"
                style={{ minHeight: 160 }}
              >
                <Text className="text-typography-400 text-sm text-center">
                  {t("today.no_partner_yet")}
                </Text>
              </Box>
            )}
          </HStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
