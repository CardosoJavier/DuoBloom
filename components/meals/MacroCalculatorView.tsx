import { SegmentedControl } from "@/components/SegmentedControl";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from "@/components/ui/actionsheet";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { WidgetCard } from "@/components/ui/widget-card";
import { calculateBulk } from "@/services/macros/BulkCalculatorService";
import { calculateCut } from "@/services/macros/CutCalculatorService";
import { calculateRecomp } from "@/services/macros/RecompCalculatorService";
import {
  ActivityLevel,
  MacroCalculatorResult,
  MacroMode,
  Sex,
} from "@/types/macros";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

const ACTIVITY_LEVELS: ActivityLevel[] = [
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "extra_active",
];

const MACRO_ITEM_COLORS = {
  protein: "bg-blue-500",
  carbs: "bg-amber-500",
  fat: "bg-red-400",
} as const;

type MacroKey = keyof typeof MACRO_ITEM_COLORS;

const MODE_KEYS: MacroMode[] = ["cut", "bulk", "recomp"];

type UnitSystem = "metric" | "imperial";

function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

// "5'10" format → cm
function feetInchesToCm(value: string): number {
  const [feetPart, inchesPart] = value.split("'");
  const feet = Number.parseInt(feetPart, 10) || 0;
  const inches = Number.parseInt(inchesPart ?? "0", 10) || 0;
  return feet * 30.48 + inches * 2.54;
}

// Auto-formats raw digit input into feet'inches (e.g. "510" → "5'10")
function formatImperialHeight(raw: string): string {
  const digits = raw.replaceAll(/[^0-9]/g, "");
  if (digits.length <= 1) return digits;
  return digits[0] + "'" + digits.slice(1, 3); // cap inches part at 2 digits
}

export function MacroCalculatorView() {
  const { t } = useTranslation();

  const [mode, setMode] = useState<MacroMode>("cut");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex>("male");
  const [activityLevel, setActivityLevel] =
    useState<ActivityLevel>("moderately_active");
  const [isActivityPickerOpen, setIsActivityPickerOpen] = useState(false);
  const [useCustomDeficit, setUseCustomDeficit] = useState(false);
  const [deficitPercent, setDeficitPercent] = useState("20");
  const [useCustomSurplus, setUseCustomSurplus] = useState(false);
  const [surplusPercent, setSurplusPercent] = useState("10");
  const [result, setResult] = useState<MacroCalculatorResult | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");

  const modeLabels = MODE_KEYS.map((m) => t(`macros.mode_${m}`));
  const activeModeLabel = t(`macros.mode_${mode}`);

  const handleModeChange = (label: string) => {
    const idx = modeLabels.indexOf(label);
    if (idx !== -1) setMode(MODE_KEYS[idx]);
    setResult(null);
  };

  const handleUnitChange = (system: UnitSystem) => {
    setUnitSystem(system);
    setWeight("");
    setHeight("");
    setResult(null);
  };

  const isFormValid =
    Number.parseFloat(weight) > 0 &&
    (unitSystem === "imperial"
      ? height.includes("'") && height.length >= 3
      : Number.parseFloat(height) > 0) &&
    Number.parseInt(age, 10) > 0;

  const handleCalculate = () => {
    const rawW = Number.parseFloat(weight);
    const rawH = Number.parseFloat(height);
    const a = Number.parseInt(age, 10);
    if (!isFormValid) return;

    const weightKg = unitSystem === "imperial" ? lbsToKg(rawW) : rawW;
    const heightCm = unitSystem === "imperial" ? feetInchesToCm(height) : rawH;

    const input = {
      weightKg,
      heightCm,
      age: a,
      sex,
      activityLevel,
      mode,
      deficitPercent:
        mode === "cut" ? Number.parseFloat(deficitPercent) || 20 : undefined,
      surplusPercent:
        mode === "bulk" ? Number.parseFloat(surplusPercent) || 10 : undefined,
    };

    if (mode === "cut") setResult(calculateCut(input));
    else if (mode === "bulk") setResult(calculateBulk(input));
    else setResult(calculateRecomp(input));
  };

  const sexOptions: Sex[] = ["male", "female"];

  const macroRows: { key: MacroKey; grams: number; pct: number }[] = result
    ? [
        { key: "protein", grams: result.protein, pct: result.proteinPercent },
        { key: "carbs", grams: result.carbs, pct: result.carbsPercent },
        { key: "fat", grams: result.fat, pct: result.fatPercent },
      ]
    : [];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <VStack space="md" className="pb-6">
        {/* Mode toggle */}
        <SegmentedControl
          options={modeLabels}
          selectedValue={activeModeLabel}
          onValueChange={handleModeChange}
          containerStyle="mb-2"
        />

        {/* Personal Info */}
        <WidgetCard
          title={t("macros.personal_info")}
          headerRight={
            <HStack space="xs">
              {(["metric", "imperial"] as UnitSystem[]).map((sys) => {
                const isActive = unitSystem === sys;
                return (
                  <Pressable
                    key={sys}
                    onPress={() => handleUnitChange(sys)}
                    className={`px-3 h-7 rounded-lg items-center justify-center border ${
                      isActive
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : "border-slate-200 dark:border-slate-600 bg-background-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isActive ? "text-primary-500" : "text-typography-400"
                      }`}
                    >
                      {t(`macros.unit_${sys}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>
          }
        >
          <VStack space="md">
            {/* Weight + Height */}
            <HStack space="md">
              <FormControl className="flex-1">
                <FormControlLabel>
                  <FormControlLabelText className="text-typography-500 text-xs">
                    {t(
                      unitSystem === "metric"
                        ? "macros.weight_kg"
                        : "macros.weight_lbs",
                    )}
                  </FormControlLabelText>
                </FormControlLabel>
                <Input variant="soft" size="md">
                  <InputField
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                    placeholder={unitSystem === "metric" ? "70" : "155"}
                  />
                </Input>
              </FormControl>

              <FormControl className="flex-1">
                <FormControlLabel>
                  <FormControlLabelText className="text-typography-500 text-xs">
                    {t(
                      unitSystem === "metric"
                        ? "macros.height_cm"
                        : "macros.height_ft",
                    )}
                  </FormControlLabelText>
                </FormControlLabel>
                <Input variant="soft" size="md">
                  <InputField
                    value={height}
                    onChangeText={(text) => {
                      if (unitSystem === "imperial") {
                        setHeight(formatImperialHeight(text));
                      } else {
                        setHeight(text);
                      }
                    }}
                    keyboardType="number-pad"
                    placeholder={unitSystem === "metric" ? "175" : "5'10"}
                  />
                </Input>
              </FormControl>
            </HStack>

            {/* Age + Sex */}
            <HStack space="md" className="items-center">
              <FormControl className="flex-1">
                <FormControlLabel>
                  <FormControlLabelText className="text-typography-500 text-xs">
                    {t("macros.age")}
                  </FormControlLabelText>
                </FormControlLabel>
                <Input variant="soft" size="md">
                  <InputField
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                    placeholder="25"
                  />
                </Input>
              </FormControl>

              <FormControl className="flex-1">
                <FormControlLabel>
                  <FormControlLabelText className="text-typography-500 text-xs">
                    {t("macros.sex")}
                  </FormControlLabelText>
                </FormControlLabel>
                <HStack space="xs" className="h-[42px]">
                  {sexOptions.map((s) => {
                    const isActive = sex === s;
                    return (
                      <Pressable
                        key={s}
                        onPress={() => setSex(s)}
                        className={`flex-1 h-full rounded-xl items-center justify-center border ${
                          isActive
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                            : "border-slate-200 dark:border-slate-600 bg-background-100"
                        }`}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            isActive
                              ? "text-primary-500"
                              : "text-typography-500"
                          }`}
                        >
                          {t(`macros.sex_${s}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </HStack>
              </FormControl>
            </HStack>

            {/* Activity Level */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText className="text-typography-600 text-xs dark:text-typography-400">
                  {t("macros.activity_level")}
                </FormControlLabelText>
              </FormControlLabel>
              <Text className="text-typography-400 text-xs mb-1.5 dark:text-typography-600">
                {t("macros.activity_level_hint")}
              </Text>
              <Pressable
                onPress={() => setIsActivityPickerOpen(true)}
                className="h-[42px] rounded-xl px-3 items-center flex-row justify-between bg-background-100"
              >
                <Text
                  className="text-slate-800 dark:text-typography-0 font-medium text-sm flex-1 mr-2"
                  numberOfLines={1}
                >
                  {t(`macros.activity_${activityLevel}`)}
                </Text>
                <Text className="text-typography-400 text-xs">▼</Text>
              </Pressable>
            </FormControl>
          </VStack>
        </WidgetCard>

        {/* Goal Settings — Cut / Bulk only */}
        {mode !== "recomp" && (
          <WidgetCard title={t("macros.goal_settings")}>
            <VStack space="md">
              <Text className="text-typography-500 text-xs">
                {mode === "cut"
                  ? t("macros.goal_settings_cut_hint")
                  : t("macros.goal_settings_bulk_hint")}
              </Text>

              {mode === "cut" ? (
                <VStack space="sm">
                  <HStack space="sm">
                    {[false, true].map((isCustom) => {
                      const isActive = useCustomDeficit === isCustom;
                      return (
                        <Pressable
                          key={String(isCustom)}
                          onPress={() => setUseCustomDeficit(isCustom)}
                          className={`flex-1 h-10 rounded-xl items-center justify-center border ${
                            isActive
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : "border-slate-200 dark:border-slate-600 bg-background-100"
                          }`}
                        >
                          <Text
                            className={`text-sm font-semibold ${isActive ? "text-primary-500" : "text-typography-500"}`}
                          >
                            {isCustom
                              ? t("macros.custom")
                              : t("macros.default_20")}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </HStack>
                  {useCustomDeficit && (
                    <Input variant="soft" size="md">
                      <InputField
                        value={deficitPercent}
                        onChangeText={setDeficitPercent}
                        keyboardType="decimal-pad"
                        placeholder={t("macros.custom_deficit_placeholder")}
                      />
                    </Input>
                  )}
                </VStack>
              ) : (
                <VStack space="sm">
                  <HStack space="sm">
                    {[false, true].map((isCustom) => {
                      const isActive = useCustomSurplus === isCustom;
                      return (
                        <Pressable
                          key={String(isCustom)}
                          onPress={() => setUseCustomSurplus(isCustom)}
                          className={`flex-1 h-10 rounded-xl items-center justify-center border ${
                            isActive
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : "border-slate-200 dark:border-slate-600 bg-background-100"
                          }`}
                        >
                          <Text
                            className={`text-sm font-semibold ${isActive ? "text-primary-500" : "text-typography-500"}`}
                          >
                            {isCustom
                              ? t("macros.custom")
                              : t("macros.default_10")}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </HStack>
                  {useCustomSurplus && (
                    <Input variant="soft" size="md">
                      <InputField
                        value={surplusPercent}
                        onChangeText={setSurplusPercent}
                        keyboardType="decimal-pad"
                        placeholder={t("macros.custom_surplus_placeholder")}
                      />
                    </Input>
                  )}
                </VStack>
              )}
            </VStack>
          </WidgetCard>
        )}

        {/* Calculate Button */}
        <Button
          action="primary"
          className="h-14"
          onPress={handleCalculate}
          isDisabled={!isFormValid}
        >
          <ButtonText>{t("macros.calculate")}</ButtonText>
        </Button>

        {/* Results */}
        {result && (
          <WidgetCard title={t("macros.results")}>
            <VStack space="xs">
              {/* BMR */}
              <HStack className="justify-between items-center py-1.5">
                <Text className="text-typography-500 text-sm">
                  {t("macros.bmr")}
                </Text>
                <Text className="text-typography-800 dark:text-typography-100 font-semibold">
                  {result.bmr} kcal
                </Text>
              </HStack>

              {/* TDEE */}
              <HStack className="justify-between items-center py-1.5">
                <Text className="text-typography-500 text-sm">
                  {t("macros.tdee")}
                </Text>
                <Text className="text-typography-800 dark:text-typography-100 font-semibold">
                  {result.tdee} kcal
                </Text>
              </HStack>

              {/* Target */}
              <HStack className="justify-between items-center py-2 border-t border-outline-100 dark:border-outline-800 mt-1">
                <Text className="text-typography-700 dark:text-typography-100 font-bold">
                  {t("macros.target_calories")}
                </Text>
                <Text className="text-primary-500 font-bold text-lg">
                  {result.targetCalories} kcal
                </Text>
              </HStack>

              {/* Delta */}
              {result.calorieDelta !== 0 && (
                <HStack className="justify-between items-center py-1.5">
                  <Text className="text-typography-500 text-sm">
                    {t("macros.delta")}
                  </Text>
                  <Text
                    className={`font-semibold ${
                      result.calorieDelta < 0
                        ? "text-success-600"
                        : "text-warning-600"
                    }`}
                  >
                    {result.calorieDelta > 0 ? "+" : ""}
                    {result.calorieDelta} kcal
                  </Text>
                </HStack>
              )}

              {/* Macros breakdown */}
              <VStack className="mt-3 pt-3 border-t border-outline-100 dark:border-outline-800">
                <Text className="text-typography-500 text-xs uppercase font-bold tracking-wider mb-2">
                  {t("macros.macros_breakdown")}
                </Text>
                {macroRows.map(({ key, grams, pct }) => (
                  <HStack
                    key={key}
                    className="justify-between items-center py-2"
                  >
                    <HStack space="sm" className="items-center">
                      <Box
                        className={`w-2.5 h-2.5 rounded-full ${MACRO_ITEM_COLORS[key]}`}
                      />
                      <Text className="text-typography-700 dark:text-typography-200 font-medium capitalize">
                        {t(`macros.${key}`)}
                      </Text>
                    </HStack>
                    <HStack space="sm" className="items-center">
                      <Text className="text-typography-800 dark:text-typography-100 font-semibold">
                        {grams}g
                      </Text>
                      <Text className="text-typography-400 text-xs w-9 text-right">
                        {pct}%
                      </Text>
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </WidgetCard>
        )}
      </VStack>

      {/* Activity Level ActionSheet */}
      <Actionsheet
        isOpen={isActivityPickerOpen}
        onClose={() => setIsActivityPickerOpen(false)}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent className="bg-background-0 dark:bg-background-dark border-t border-outline-200 dark:border-outline-800 rounded-t-3xl pt-2 pb-10">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator className="bg-outline-400 dark:bg-outline-700" />
          </ActionsheetDragIndicatorWrapper>
          <Text className="text-typography-800 dark:text-typography-100 font-bold text-base mt-2 mb-3 px-2 w-full">
            {t("macros.activity_level")}
          </Text>
          {ACTIVITY_LEVELS.map((level) => {
            const isSelected = activityLevel === level;
            return (
              <ActionsheetItem
                key={level}
                onPress={() => {
                  setActivityLevel(level);
                  setIsActivityPickerOpen(false);
                }}
                className={
                  isSelected ? "bg-primary-50 dark:bg-primary-900/20" : ""
                }
              >
                <ActionsheetItemText
                  className={
                    isSelected
                      ? "text-primary-500 font-semibold"
                      : "text-typography-700 dark:text-typography-200"
                  }
                >
                  {t(`macros.activity_${level}`)}
                </ActionsheetItemText>
              </ActionsheetItem>
            );
          })}
        </ActionsheetContent>
      </Actionsheet>
    </ScrollView>
  );
}
