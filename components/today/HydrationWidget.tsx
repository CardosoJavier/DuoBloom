import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
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
    <Box
      className="flex-1 rounded-[32px] border border-outline-100 dark:border-outline-800 bg-background-0 dark:bg-background-dark overflow-hidden"
      style={{ minHeight: 160 }}
    >
      <VStack className="p-5 gap-1 flex-1">
        <HStack className="items-center gap-2">
          <Droplets size={14} color="#60a5fa" />
          <Text className="text-typography-500 uppercase font-bold tracking-wider text-xs">
            {t("today.hydration")}
          </Text>
        </HStack>

        <HStack className="items-baseline gap-0.5 mt-2">
          <Text className="text-typography-900 dark:text-white font-bold text-4xl leading-none">
            {glassesConsumed}
          </Text>
          <Text className="text-typography-400 font-semibold text-xl leading-none">
            /{GLASSES_GOAL}
          </Text>
        </HStack>
        <Text className="text-typography-400 text-xs">
          {t("today.glasses_today")}
        </Text>
      </VStack>

      {/* Progress bar at bottom edge */}
      <Box className="mx-5 mb-4 h-1.5 rounded-full bg-blue-100 dark:bg-blue-950">
        <Box
          className="h-1.5 rounded-full bg-blue-400"
          style={{ width: `${progressPercent}%` }}
        />
      </Box>
    </Box>
  );
}
