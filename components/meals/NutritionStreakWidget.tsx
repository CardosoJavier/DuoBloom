import { CalendarGrid } from "@/components/meals/CalendarGrid";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { WidgetCard } from "@/components/ui/widget-card";
import { CalendarDays } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { ViewStyle } from "react-native";

interface NutritionStreakWidgetProps {
  readonly completedDays: number;
  readonly completedSet: Set<string>;
  readonly selectedDate: Date;
  readonly showEmptyMessage?: boolean;
  readonly style?: ViewStyle;
}

export function NutritionStreakWidget({
  completedDays,
  completedSet,
  selectedDate,
  showEmptyMessage = false,
  style,
}: NutritionStreakWidgetProps) {
  const { t } = useTranslation();

  return (
    <WidgetCard
      icon={<CalendarDays size={14} color="#9ca3af" />}
      title={t("streak.nutrition_streak")}
      style={style}
    >
      <HStack className="items-baseline gap-2">
        <Text className="text-typography-900 dark:text-white font-bold text-4xl leading-none tracking-tight">
          {completedDays}
        </Text>
        <Text className="text-typography-500 text-base font-medium mb-1">
          {t("streak.days_on_target")}
        </Text>
      </HStack>

      {showEmptyMessage && (
        <Text className="text-typography-500">{t("streak.empty_month")}</Text>
      )}

      <VStack>
        <CalendarGrid selectedDate={selectedDate} completedSet={completedSet} />
      </VStack>
    </WidgetCard>
  );
}
