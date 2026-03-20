import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { WidgetCard } from "@/components/ui/widget-card";
import { Flame, Target } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";

interface StreakWidgetsProps {
  readonly currentStreakDays: number;
  readonly completionPercent: number;
}

export function StreakWidgets({
  currentStreakDays,
  completionPercent,
}: StreakWidgetsProps) {
  const { t } = useTranslation();

  return (
    <HStack className="gap-4">
      <WidgetCard
        icon={<Flame size={14} color="#f97316" />}
        title={t("streak.current_streak")}
        className="flex-1"
        style={{ minHeight: 140 }}
      >
        <HStack className="items-baseline gap-1 mt-2">
          <Text className="text-primary-500 font-bold text-5xl leading-none">
            {currentStreakDays}
          </Text>
          <Text className="text-typography-500 text-lg font-medium mb-0.5 ml-1">
            {t("streak.days").toLowerCase()}
          </Text>
        </HStack>
      </WidgetCard>

      <WidgetCard
        icon={<Target size={14} color="#9ca3af" />}
        title={t("streak.total_completion")}
        className="flex-1"
        style={{ minHeight: 140 }}
      >
        <HStack className="items-baseline gap-1 mt-2">
          <Text className="text-typography-900 dark:text-white font-bold text-5xl leading-none">
            {completionPercent}
          </Text>
          <Text className="text-typography-500 text-xl font-bold mb-0.5">
            %
          </Text>
        </HStack>
      </WidgetCard>
    </HStack>
  );
}
