import { format } from "date-fns";
import { BarChart2, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView } from "react-native";

import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Calendar,
  CalendarBody,
  CalendarGrid,
  CalendarHeader,
  CalendarHeaderNextButton,
  CalendarHeaderPrevButton,
  CalendarHeaderTitle,
  CalendarWeekDaysHeader,
} from "@/components/ui/calendar";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { ChevronLeftIcon, ChevronRightIcon, Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { ProgressStatInput } from "@/types/progress";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AddStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: ProgressStatInput) => Promise<void>;
  isSaving: boolean;
  defaultDate?: string; // 'YYYY-MM-DD', defaults to today
}

type UnitToggle = "kg" | "lb";

// ── Component ──────────────────────────────────────────────────────────────────

export function AddStatsModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
  defaultDate,
}: Readonly<AddStatsModalProps>) {
  const { t } = useTranslation();
  const today = format(new Date(), "yyyy-MM-dd");

  const [unit, setUnit] = useState<UnitToggle>("kg");
  const [weightValue, setWeightValue] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [recordedDate, setRecordedDate] = useState(defaultDate ?? today);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) setRecordedDate(defaultDate ?? today);
  }, [isOpen, defaultDate]);

  const reset = () => {
    setUnit("kg");
    setWeightValue("");
    setBodyFat("");
    setRecordedDate(defaultDate ?? today);
    setDatePickerOpen(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    const weight = Number.parseFloat(weightValue);
    const fat = bodyFat ? Number.parseFloat(bodyFat) : undefined;

    if (weightValue && Number.isNaN(weight)) {
      Alert.alert(t("common.error"), t("common.warning"));
      return;
    }

    const input: ProgressStatInput = {
      recordedDate,
      ...(weightValue &&
        unit === "kg" && { weightKg: weight, weightLb: weight * 2.20462 }),
      ...(weightValue &&
        unit === "lb" && { weightLb: weight, weightKg: weight / 2.20462 }),
      ...(fat !== undefined && !Number.isNaN(fat) && { bodyFat: fat }),
    };

    await onSave(input);
    reset();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="md">
        <ModalBackdrop />
        <ModalContent className="bg-background-0 border border-outline-100 dark:border-outline-800 rounded-3xl">
          <ModalHeader className="px-6 pt-6 pb-3">
            <HStack className="items-center gap-2">
              <Icon as={BarChart2} size="md" className="text-primary-500" />
              <Heading
                size="md"
                className="text-typography-900 dark:text-white"
              >
                {t("stats.add_entry")}
              </Heading>
            </HStack>
            <ModalCloseButton onPress={handleClose}>
              <Icon as={X} size="md" className="text-typography-500" />
            </ModalCloseButton>
          </ModalHeader>

          <ModalBody className="px-6">
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <VStack className="gap-5 pb-2">
                {/* Weight */}
                <FormControl>
                  <FormControlLabel>
                    <FormControlLabelText className="text-typography-700 dark:text-typography-200">
                      {t("stats.weight_label")}
                    </FormControlLabelText>
                  </FormControlLabel>

                  {/* Unit toggle */}
                  <HStack className="gap-2 mb-2">
                    {(["kg", "lb"] as UnitToggle[]).map((u) => (
                      <Pressable
                        key={u}
                        onPress={() => setUnit(u)}
                        className={`px-4 py-1.5 rounded-full ${
                          unit === u
                            ? "bg-primary-500"
                            : "bg-background-100 dark:bg-background-700"
                        }`}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            unit === u
                              ? "text-white"
                              : "text-typography-600 dark:text-typography-300"
                          }`}
                        >
                          {t(`stats.unit_${u}`)}
                        </Text>
                      </Pressable>
                    ))}
                  </HStack>

                  <Input className="rounded-xl">
                    <InputField
                      keyboardType="decimal-pad"
                      placeholder={"0.0 " + t("stats.unit_" + unit)}
                      value={weightValue}
                      onChangeText={setWeightValue}
                    />
                  </Input>
                </FormControl>

                {/* Body Fat */}
                <FormControl>
                  <FormControlLabel>
                    <FormControlLabelText className="text-typography-700 dark:text-typography-200">
                      {t("stats.fat_label")}
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input className="rounded-xl">
                    <InputField
                      keyboardType="decimal-pad"
                      placeholder="0.0 %"
                      value={bodyFat}
                      onChangeText={setBodyFat}
                    />
                  </Input>
                </FormControl>

                {/* Date */}
                <FormControl>
                  <FormControlLabel>
                    <FormControlLabelText className="text-typography-700 dark:text-typography-200">
                      {t("stats.date_label")}
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Pressable
                    onPress={() => setDatePickerOpen(true)}
                    className="border border-outline-300 dark:border-outline-700 rounded-xl px-4 py-3"
                  >
                    <Text className="text-typography-800 dark:text-typography-100">
                      {recordedDate}
                    </Text>
                  </Pressable>
                </FormControl>
              </VStack>
            </ScrollView>
          </ModalBody>

          <ModalFooter className="px-6 pb-6 gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onPress={handleClose}
            >
              <ButtonText>{t("stats.cancel")}</ButtonText>
            </Button>
            <Button
              className="flex-1 rounded-xl bg-primary-500"
              onPress={() => void handleSave()}
              isDisabled={isSaving || (!weightValue && !bodyFat)}
            >
              <ButtonText className="text-white">
                {isSaving ? t("common.saving") : t("stats.save")}
              </ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Date picker ActionSheet */}
      <Actionsheet
        isOpen={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent className="bg-background-0 pb-8">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <Text className="text-typography-700 dark:text-typography-200 font-semibold text-base mt-3 mb-1 px-4">
            {t("stats.date_label")}
          </Text>
          <VStack className="w-full mt-2 items-center h-[480px]">
            <Calendar
              mode="single"
              value={new Date(recordedDate)}
              onValueChange={(d: Date) => {
                setRecordedDate(format(d, "yyyy-MM-dd"));
                setDatePickerOpen(false);
              }}
              className="w-full bg-transparent border-0 px-4 py-2"
            >
              <CalendarHeader className="flex-row justify-between w-full mb-6 px-2 items-center">
                <CalendarHeaderPrevButton className="bg-background-100 dark:bg-background-500 rounded-lg h-10 w-10 active:bg-background-200 dark:active:bg-background-600 items-center justify-center">
                  <Icon as={ChevronLeftIcon} className="text-typography-600" />
                </CalendarHeaderPrevButton>
                <CalendarHeaderTitle className="text-typography-900 dark:text-white font-bold text-lg" />
                <CalendarHeaderNextButton className="bg-background-100 dark:bg-background-500 rounded-lg h-10 w-10 active:bg-background-200 dark:active:bg-background-600 items-center justify-center">
                  <Icon as={ChevronRightIcon} className="text-typography-600" />
                </CalendarHeaderNextButton>
              </CalendarHeader>
              <CalendarWeekDaysHeader className="flex-row justify-between border-b border-outline-200 dark:border-outline-800 pb-3 mb-3 w-full" />
              <CalendarBody>
                <CalendarGrid className="w-full gap-2" />
              </CalendarBody>
            </Calendar>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
