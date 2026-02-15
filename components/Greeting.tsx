import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import React from "react";
import { useTranslation } from "react-i18next";

interface GreetingProps {
  name: string;
  streak: number;
}

export const Greeting = ({ name, streak }: GreetingProps) => {
  const { t } = useTranslation();

  return (
    <Box className="p-4 bg-primary-50 rounded-lg">
      <Heading size="xl" className="text-primary-900 mb-2">
        {t("common.welcome")}, {name}!
      </Heading>
      <Text className="text-primary-700">
        {t("habits.strike_count", { count: streak })}
      </Text>
    </Box>
  );
};
