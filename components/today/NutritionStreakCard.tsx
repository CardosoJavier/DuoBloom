import { getMonthlyMealCompletionDates } from "@/api/streak-api";
import { CalendarGrid } from "@/components/meals/CalendarGrid";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react-native";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function NutritionStreakCard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fromDate = toDateKey(monthStart);
  const toDate = toDateKey(monthEnd);
  const displayMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data: completedDates = [] } = useQuery({
    queryKey: ["streak-monthly", user?.id, fromDate, toDate],
    queryFn: () =>
      getMonthlyMealCompletionDates(user!.id, fromDate, toDate).then(
        (r) => r.data ?? [],
      ),
    enabled: !!user?.id,
  });

  const completedSet = useMemo(() => new Set(completedDates), [completedDates]);
  const daysOnTarget = completedDates.length;

  return (
    <Box className="rounded-[32px] border border-outline-100 dark:border-outline-800 bg-background-0 dark:bg-background-dark p-6 gap-3">
      <HStack className="items-center gap-2">
        <CalendarDays size={14} color="#9ca3af" />
        <Text className="text-typography-500 uppercase font-bold tracking-wider text-xs">
          {t("today.nutrition_streak_title")}
        </Text>
      </HStack>

      <HStack className="items-baseline gap-2">
        <Text className="text-typography-900 dark:text-white font-bold text-4xl leading-none">
          {daysOnTarget}
        </Text>
        <Text className="text-typography-400 text-base">
          {t("streak.days_on_target")}
        </Text>
      </HStack>

      <CalendarGrid selectedDate={displayMonth} completedSet={completedSet} />
    </Box>
  );
}
