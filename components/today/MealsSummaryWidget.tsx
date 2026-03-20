import { getConsumedMeals } from "@/api/meals-api";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/store/authStore";
import { ConsumedMeal } from "@/types/meals";
import { useQuery } from "@tanstack/react-query";
import { Utensils } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const MAX_BARS = 3;

interface MealBarsProps {
  readonly count: number;
  readonly color: string;
}

function MealBars({ count, color }: MealBarsProps) {
  return (
    <HStack className="gap-1 items-center">
      {Array.from({ length: MAX_BARS }, (_, i) => `bar-${i}`).map((key, i) => (
        <Box
          key={key}
          className="rounded-full"
          style={{
            width: 8,
            height: 26,
            backgroundColor: i < count ? color : "#E5E7EB",
          }}
        />
      ))}
    </HStack>
  );
}

interface PersonRowProps {
  readonly name: string;
  readonly initial: string;
  readonly mealCount: number;
  readonly avatarColor: string;
  readonly barColor: string;
}

function PersonRow({
  name,
  initial,
  mealCount,
  avatarColor,
  barColor,
}: PersonRowProps) {
  return (
    <HStack className="items-center justify-between">
      <HStack className="items-center gap-2 flex-1">
        <Box
          className="w-7 h-7 rounded-full items-center justify-center"
          style={{ backgroundColor: avatarColor }}
        >
          <Text className="text-white font-bold text-xs">
            {initial.toUpperCase()}
          </Text>
        </Box>
        <Text className="text-typography-700 dark:text-typography-200 text-sm font-medium">
          {name}
        </Text>
      </HStack>
      <MealBars count={mealCount} color={barColor} />
    </HStack>
  );
}

export function MealsSummaryWidget() {
  const { t } = useTranslation();
  const { user, partner } = useAuthStore();

  const today = new Date();
  const todayStr = toLocalDateString(today);

  const { data: meals = [] } = useQuery<ConsumedMeal[]>({
    queryKey: ["today-meals", user?.id, todayStr],
    queryFn: async () => {
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      const result = await getConsumedMeals(
        startOfDay.toISOString(),
        endOfDay.toISOString(),
      );
      return result.success ? (result.data ?? []) : [];
    },
    enabled: !!user?.id,
  });

  const userMealCount = Math.min(
    meals.filter((m) => m.user_id === user?.id).length,
    MAX_BARS,
  );
  const partnerMealCount = Math.min(
    meals.filter((m) => m.user_id === partner?.id).length,
    MAX_BARS,
  );

  return (
    <Box
      className="flex-1 rounded-[32px] border border-outline-100 dark:border-outline-800 bg-background-0 dark:bg-background-dark p-5"
      style={{ minHeight: 140 }}
    >
      <HStack className="items-center gap-2">
        <Utensils size={14} color="#9ca3af" />
        <Text className="text-typography-500 uppercase font-bold tracking-wider text-xs">
          {t("today.meals")}
        </Text>
      </HStack>

      <VStack className="gap-3 mt-4">
        <PersonRow
          name={t("today.me")}
          initial={user?.firstName?.[0] ?? "M"}
          mealCount={userMealCount}
          avatarColor="#6366f1"
          barColor="#6366f1"
        />
        {partner ? (
          <PersonRow
            name={partner.firstName ?? t("today.partner")}
            initial={partner.firstName?.[0] ?? "P"}
            mealCount={partnerMealCount}
            avatarColor="#ec4899"
            barColor="#ec4899"
          />
        ) : (
          <Text className="text-typography-400 text-xs">
            {t("today.no_partner_yet")}
          </Text>
        )}
      </VStack>
    </Box>
  );
}
