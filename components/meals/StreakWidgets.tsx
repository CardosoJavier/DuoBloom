import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
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
      <Box className="flex-1 rounded-[32px] border border-outline-100 dark:border-outline-800 bg-background-0 dark:bg-background-dark p-6 min-h-[140px] justify-between shadow-sm">
        <Text className="text-typography-500 uppercase font-bold tracking-wider text-xs">
          {t("streak.current_streak")}
        </Text>
        <HStack className="items-baseline gap-1 mt-4">
          <Text className="text-primary-500 font-bold text-5xl leading-none">
            {currentStreakDays}
          </Text>
          <Text className="text-typography-500 text-lg mb-0.5 font-medium ml-1">
            {t("streak.days").toLowerCase()}
          </Text>
        </HStack>
      </Box>

      <Box className="flex-1 rounded-[32px] border border-outline-100 dark:border-outline-800 bg-background-0 dark:bg-background-dark p-6 min-h-[140px] justify-between shadow-sm">
        <Text className="text-typography-500 uppercase font-bold tracking-wider text-xs">
          {t("streak.total_completion")}
        </Text>
        <HStack className="items-baseline gap-1 mt-4">
          <Text className="text-typography-900 dark:text-white font-bold text-5xl leading-none">
            {completionPercent}
          </Text>
          <Text className="text-typography-500 text-xl font-bold mb-0.5">
            %
          </Text>
        </HStack>
      </Box>
    </HStack>
  );
}
