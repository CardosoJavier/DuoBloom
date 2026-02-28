import { SegmentedControl } from "@/components/SegmentedControl";
import { MealsView } from "@/components/meals/MealsView";
import { StreakView } from "@/components/meals/StreakView";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MealsScreen() {
  const [activeTab, setActiveTab] = useState<string>("Meals");

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <VStack className="flex-1 p-4">
        <SegmentedControl
          options={["Meals", "Streak"]}
          selectedValue={activeTab}
          onValueChange={setActiveTab}
          containerStyle="mb-6"
        />

        <Box className="flex-1">
          {activeTab === "Meals" ? <MealsView /> : <StreakView />}
        </Box>
      </VStack>
    </SafeAreaView>
  );
}
