import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { WidgetCard } from "@/components/ui/widget-card";
import { Droplets } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";

const GLASSES_GOAL = 8;

export function HydrationWidget() {
  const { t } = useTranslation();
  // Placeholder — hydration tracking not yet implemented
  const glassesConsumed = 0;
  const progressPercent = (glassesConsumed / GLASSES_GOAL) * 100;

  return (
    <WidgetCard
      icon={<Droplets size={14} color="#60a5fa" />}
      title={t("today.hydration")}
      className="flex-1"
      style={{ minHeight: 160 }}
      footer={
        <Box className="mx-6 mb-5 h-1.5 rounded-full bg-blue-100 dark:bg-blue-950">
          <Box
            className="h-1.5 rounded-full bg-blue-400"
            style={{ width: `${progressPercent}%` }}
          />
        </Box>
      }
    >
      <VStack className="gap-1">
        <HStack className="items-baseline gap-0.5">
          <Text className="text-typography-900 dark:text-white font-bold text-4xl leading-none">
            {glassesConsumed}
          </Text>
          <Text className="text-typography-400 font-semibold text-xl leading-none">
            /{GLASSES_GOAL}
          </Text>
        </HStack>
        <Text className="text-typography-600 text-xs dark:text-typography-300">
          {t("today.glasses_today")}
        </Text>
      </VStack>
    </WidgetCard>
  );
}
