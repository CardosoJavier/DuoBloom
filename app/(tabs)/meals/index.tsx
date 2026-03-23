import { SegmentedControl } from "@/components/SegmentedControl";
import { MacroCalculatorView } from "@/components/meals/MacroCalculatorView";
import { MealsView } from "@/components/meals/MealsView";
import { StreakView } from "@/components/meals/StreakView";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

type MealsTab = "meals" | "streak" | "macros";

export default function MealsScreen() {
  const { view } = useLocalSearchParams<{ view?: string }>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<MealsTab>("meals");

  const tabMeals = t("meals.tab_meals");
  const tabStreak = t("meals.tab_streak");
  const tabMacros = t("macros.tab_label");

  const tabLabels = [tabMeals, tabStreak, tabMacros];
  const tabKeys: MealsTab[] = ["meals", "streak", "macros"];

  useEffect(() => {
    if (view === "streak") setActiveTab("streak");
    else if (view === "meals") setActiveTab("meals");
  }, [view]);

  const handleTabChange = (label: string) => {
    const idx = tabLabels.indexOf(label);
    if (idx !== -1) setActiveTab(tabKeys[idx]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <VStack className="flex-1 p-4">
        <SegmentedControl
          options={tabLabels}
          selectedValue={tabLabels[tabKeys.indexOf(activeTab)]}
          onValueChange={handleTabChange}
          containerStyle="mb-6"
        />

        <Box className="flex-1">
          {activeTab === "meals" && <MealsView />}
          {activeTab === "streak" && <StreakView />}
          {activeTab === "macros" && <MacroCalculatorView />}
        </Box>
      </VStack>
    </SafeAreaView>
  );
}
