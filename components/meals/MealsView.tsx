import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import React, { useState } from "react";
import { DateNavigator } from "../DateNavigator";

export function MealsView() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <Box className="flex-1 justify-center items-center">
      <Text size="xl" className="font-bold text-typography-900">
        Meals Content
      </Text>
      <Text className="text-typography-500 mt-2">Log and track your meals</Text>
      <DateNavigator
        date={selectedDate}
        onDateChange={(newDate) => setSelectedDate(newDate)}
        className="mb-8"
      />
    </Box>
  );
}
