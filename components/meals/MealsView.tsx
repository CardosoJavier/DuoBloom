import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import React from "react";

export function MealsView() {
  return (
    <Box className="flex-1 justify-center items-center">
      <Text size="xl" className="font-bold text-typography-900">
        Meals Content
      </Text>
      <Text className="text-typography-500 mt-2">Log and track your meals</Text>
    </Box>
  );
}
