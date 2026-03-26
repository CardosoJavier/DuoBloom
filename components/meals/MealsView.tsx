import { useAppStore } from "@/store/appStore";
import {
  DailyNutritionGoal,
  FoodItem,
  MealSection,
  MealType,
} from "@/types/food-log";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { Circle, G, Svg } from "react-native-svg";
import { DateNavigator } from "../DateNavigator";
import { Box } from "../ui/box";
import { HStack } from "../ui/hstack";
import { Pressable } from "../ui/pressable";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";
import { WidgetCard } from "../ui/widget-card";
import { AddFoodModal } from "./AddFoodModal";

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_GOAL: DailyNutritionGoal = {
  kcal: 2000,
  macros: { proteinG: 150, carbsG: 200, fatG: 65 },
};

const MOCK_SECTIONS: MealSection[] = [
  {
    type: "breakfast",
    items: [
      { id: "1", name: "Oatmeal", kcal: 150, protein: 5, carbs: 37, fat: 2.5 },
      { id: "2", name: "Banana", kcal: 105, protein: 1.3, carbs: 27, fat: 0.3 },
    ],
  },
  { type: "lunch", items: [] },
  { type: "dinner", items: [] },
  { type: "snacks", items: [] },
];

// ── CaloriesDonut ──────────────────────────────────────────────────────────────

interface CaloriesDonutProps {
  readonly eaten: number;
  readonly goal: number;
  readonly isDark: boolean;
}

function CaloriesDonut({ eaten, goal, isDark }: CaloriesDonutProps) {
  const { t } = useTranslation();
  const size = 76;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(eaten / goal, 1);
  const strokeDashoffset = circumference * (1 - progress);
  const cx = size / 2;
  const cy = size / 2;

  const trackColor = isDark ? "#374151" : "#E5E7EB";
  const progressColor = isDark ? "#818cf8" : "#6366f1";

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G transform={`rotate(-90, ${cx}, ${cy})`}>
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text className="text-typography-900 dark:text-typography-50 font-bold text-base leading-tight">
          {eaten}
        </Text>
        <Text className="text-typography-400 text-[9px] leading-tight">
          {t("meals.kcal_eaten")}
        </Text>
      </View>
    </View>
  );
}

// ── MacroBar ───────────────────────────────────────────────────────────────────

interface MacroBarProps {
  readonly label: string;
  readonly current: number;
  readonly goal: number;
  readonly fillClass: string;
}

function MacroBar({ label, current, goal, fillClass }: MacroBarProps) {
  const pct = Math.min((current / goal) * 100, 100);

  return (
    <HStack className="items-center gap-2">
      <Text className="text-typography-400 text-xs w-14" numberOfLines={1}>
        {label}
      </Text>
      <Text className="text-typography-500 text-xs w-16">
        {Math.round(current * 10) / 10}/{goal}g
      </Text>
      <View className="flex-1 h-1.5 bg-background-200 dark:bg-background-700 rounded-full overflow-hidden">
        <View
          className={`h-full rounded-full ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </View>
    </HStack>
  );
}

// ── CaloriesSummaryCard ────────────────────────────────────────────────────────

interface CaloriesSummaryCardProps {
  readonly goal: DailyNutritionGoal;
  readonly totalEaten: number;
  readonly totalProtein: number;
  readonly totalCarbs: number;
  readonly totalFat: number;
  readonly isDark: boolean;
}

function CaloriesSummaryCard({
  goal,
  totalEaten,
  totalProtein,
  totalCarbs,
  totalFat,
  isDark,
}: CaloriesSummaryCardProps) {
  const { t } = useTranslation();
  const remaining = Math.max(goal.kcal - totalEaten, 0);

  return (
    <WidgetCard className="mb-4">
      <HStack className="items-center justify-between gap-4">
        <VStack className="flex-1 gap-1">
          <Text className="text-typography-400 text-xs uppercase tracking-wider font-semibold">
            {t("meals.calories_remaining")}
          </Text>
          <Text className="text-typography-900 dark:text-typography-50 font-bold text-4xl leading-tight">
            {remaining}
          </Text>
          <Text className="text-typography-400 text-xs">
            {t("meals.goal_kcal", { count: goal.kcal })}
          </Text>
        </VStack>

        <CaloriesDonut eaten={totalEaten} goal={goal.kcal} isDark={isDark} />
      </HStack>

      <VStack className="gap-2 mt-2">
        <MacroBar
          label={t("macros.protein")}
          current={totalProtein}
          goal={goal.macros.proteinG}
          fillClass="bg-blue-500"
        />
        <MacroBar
          label={t("macros.carbs")}
          current={totalCarbs}
          goal={goal.macros.carbsG}
          fillClass="bg-orange-400"
        />
        <MacroBar
          label={t("macros.fat")}
          current={totalFat}
          goal={goal.macros.fatG}
          fillClass="bg-rose-400"
        />
      </VStack>
    </WidgetCard>
  );
}

// ── FoodItemRow ────────────────────────────────────────────────────────────────

interface FoodItemRowProps {
  readonly item: FoodItem;
  readonly isLast: boolean;
}

function FoodItemRow({ item, isLast }: FoodItemRowProps) {
  const macroSummary = `${item.protein}gP · ${item.carbs}gC · ${item.fat}gF`;

  return (
    <Pressable>
      <HStack
        className={`items-center justify-between py-2.5 ${
          isLast
            ? ""
            : "border-b border-background-100 dark:border-background-700"
        }`}
      >
        <VStack className="flex-1 gap-0.5">
          <Text className="text-typography-800 dark:text-typography-100 text-sm font-medium">
            {item.name}
          </Text>
          <Text className="text-typography-400 text-xs">{macroSummary}</Text>
        </VStack>
        <Text className="text-typography-500 text-sm font-medium ml-4">
          {item.kcal} kcal
        </Text>
      </HStack>
    </Pressable>
  );
}

// ── MealSectionCard ────────────────────────────────────────────────────────────

interface MealSectionCardProps {
  readonly section: MealSection;
  readonly sectionLabel: string;
  readonly isExpanded: boolean;
  readonly isDark: boolean;
  readonly onToggle: () => void;
  readonly onAddFoodPress: (type: MealType) => void;
}

function MealSectionCard({
  section,
  sectionLabel,
  isExpanded,
  isDark,
  onToggle,
  onAddFoodPress,
}: MealSectionCardProps) {
  const { t } = useTranslation();
  const totalKcal = section.items.reduce((sum, i) => sum + i.kcal, 0);
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <WidgetCard>
      <Pressable onPress={onToggle}>
        <HStack className="items-center justify-between">
          <Text className="text-typography-800 dark:text-typography-100 font-semibold text-base">
            {sectionLabel}
          </Text>
          <HStack className="items-center gap-2">
            {totalKcal > 0 && (
              <Text className="text-typography-400 text-sm">
                {totalKcal} kcal
              </Text>
            )}
            <ChevronIcon size={16} color={isDark ? "#9ca3af" : "#6b7280"} />
          </HStack>
        </HStack>
      </Pressable>

      {isExpanded && (
        <VStack className="mt-1">
          {section.items.map((item, idx) => (
            <FoodItemRow
              key={item.id}
              item={item}
              isLast={idx === section.items.length - 1}
            />
          ))}

          <Pressable
            onPress={() => onAddFoodPress(section.type)}
            className="mt-2"
          >
            <HStack className="items-center justify-center py-2.5 border border-dashed border-background-300 dark:border-background-600 rounded-xl">
              <Text className="text-primary-500 text-sm font-medium">
                {t("meals.add_food")}
              </Text>
            </HStack>
          </Pressable>
        </VStack>
      )}
    </WidgetCard>
  );
}

// ── MealsView ──────────────────────────────────────────────────────────────────

export function MealsView() {
  const { t } = useTranslation();
  const { colorScheme } = useAppStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sections] = useState<MealSection[]>(MOCK_SECTIONS);
  const [goal] = useState<DailyNutritionGoal>(MOCK_GOAL);
  const [activeMealType, setActiveMealType] = useState<MealType | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<MealType>>(
    new Set<MealType>(["breakfast", "lunch", "dinner", "snacks"]),
  );

  const isDark = colorScheme === "dark";

  const { totalEaten, totalProtein, totalCarbs, totalFat } = useMemo(() => {
    const allItems = sections.flatMap((s) => s.items);
    return {
      totalEaten: allItems.reduce((s, i) => s + i.kcal, 0),
      totalProtein: allItems.reduce((s, i) => s + i.protein, 0),
      totalCarbs: allItems.reduce((s, i) => s + i.carbs, 0),
      totalFat: allItems.reduce((s, i) => s + i.fat, 0),
    };
  }, [sections]);

  const toggleSection = useCallback((type: MealType) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  return (
    <Box className="flex-1 bg-background-0">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <DateNavigator
          date={selectedDate}
          onDateChange={(d) => setSelectedDate(d)}
          className="mb-6"
        />

        <CaloriesSummaryCard
          goal={goal}
          totalEaten={totalEaten}
          totalProtein={totalProtein}
          totalCarbs={totalCarbs}
          totalFat={totalFat}
          isDark={isDark}
        />

        <VStack className="gap-3">
          {sections.map((section) => (
            <MealSectionCard
              key={section.type}
              section={section}
              sectionLabel={t(`meals.${section.type}`)}
              isExpanded={expandedSections.has(section.type)}
              isDark={isDark}
              onToggle={() => toggleSection(section.type)}
              onAddFoodPress={setActiveMealType}
            />
          ))}
        </VStack>
      </ScrollView>

      <AddFoodModal
        isOpen={activeMealType !== null}
        mealType={activeMealType}
        onClose={() => setActiveMealType(null)}
        onSelectFood={(_item, _type) => {
          setActiveMealType(null);
        }}
      />
    </Box>
  );
}
