import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { CalendarDays, Repeat } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { progressApi } from "@/api/progress-api";
import { ComparisonCard } from "@/components/progress/ComparisonCard";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Box } from "@/components/ui/box";
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
import { HStack } from "@/components/ui/hstack";
import { ChevronLeftIcon, ChevronRightIcon, Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ComparisonViewProps {
  myId: string;
  myFirstName: string;
  partnerId?: string;
  partnerFirstName?: string;
  partnerPrivacyOn: boolean;
  colorScheme: "light" | "dark";
}

type ComparisonTarget = "mine" | "partner";
type DatePickerSlot = "before" | "after";

// ── Date picker button ─────────────────────────────────────────────────────────

interface DatePickerButtonProps {
  label: string;
  date: Date;
  onPress: () => void;
  colorScheme: "light" | "dark";
}

const DatePickerButton: React.FC<DatePickerButtonProps> = ({
  label,
  date,
  onPress,
  colorScheme,
}) => {
  const bg = colorScheme === "light" ? "bg-background-50" : "bg-[#1e2d3d]";
  const border =
    colorScheme === "light" ? "border-outline-100" : "border-outline-600";

  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 rounded-2xl border p-3 items-center gap-1 ${bg} ${border}`}
    >
      <Text className="text-typography-400 text-[10px] font-semibold tracking-wider uppercase">
        {label}
      </Text>
      <HStack className="items-center gap-1.5">
        <Icon as={CalendarDays} size="xs" className="text-typography-500" />
        <Text className="text-typography-800 dark:text-typography-100 text-sm font-semibold">
          {format(date, "EEE, MMM d")}
        </Text>
      </HStack>
    </Pressable>
  );
};

// ── ComparisonView ─────────────────────────────────────────────────────────────

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  myId,
  myFirstName,
  partnerId,
  partnerFirstName,
  partnerPrivacyOn,
  colorScheme,
}) => {
  const { t } = useTranslation();
  const hasPartner = Boolean(partnerId);

  const [target, setTarget] = useState<ComparisonTarget>("mine");
  const [beforeDate, setBeforeDate] = useState<Date>(subDays(new Date(), 30));
  const [afterDate, setAfterDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState<DatePickerSlot | null>(
    null,
  );

  const targetId = target === "mine" ? myId : partnerId!;
  const targetName =
    target === "mine" ? myFirstName : (partnerFirstName ?? "Partner");

  const beforeDateStr = format(beforeDate, "yyyy-MM-dd");
  const afterDateStr = format(afterDate, "yyyy-MM-dd");

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: earliestDate } = useQuery({
    queryKey: ["progress-earliest-date", targetId],
    queryFn: async () => {
      const result = await progressApi.getEarliestPhotoDate(targetId);
      if (!result.success) throw result.error;
      return result.data;
    },
    enabled: !!targetId,
    staleTime: 5 * 60_000,
  });

  // Seed beforeDate from earliest recorded photo when target changes
  useEffect(() => {
    if (earliestDate) {
      const [year, month, day] = earliestDate.split("-").map(Number);
      setBeforeDate(new Date(year, month - 1, day));
    } else {
      setBeforeDate(subDays(new Date(), 30));
    }
  }, [earliestDate, target]);

  const { data: beforePhotos = [], isFetching: beforeLoading } = useQuery({
    queryKey: ["progress-photos", targetId, beforeDateStr],
    queryFn: async () => {
      const result = await progressApi.getProgressPhotosForDate(
        targetId,
        beforeDateStr,
      );
      if (!result.success) throw result.error;
      return result.data;
    },
    enabled: !!targetId,
  });

  const { data: afterPhotos = [], isFetching: afterLoading } = useQuery({
    queryKey: ["progress-photos", targetId, afterDateStr],
    queryFn: async () => {
      const result = await progressApi.getProgressPhotosForDate(
        targetId,
        afterDateStr,
      );
      if (!result.success) throw result.error;
      return result.data;
    },
    enabled: !!targetId,
  });

  const isLoading = beforeLoading || afterLoading;

  const borderColor =
    colorScheme === "light" ? "border-outline-100" : "border-outline-600";

  const beforePhoto = beforePhotos[0] ?? null;
  const afterPhoto = afterPhotos[0] ?? null;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleTargetToggle = () => {
    if (!hasPartner) return;
    setTarget((prev) => (prev === "mine" ? "partner" : "mine"));
  };

  const handleDateSelect = (date: Date) => {
    if (datePickerOpen === "before") {
      setBeforeDate(date);
    } else if (datePickerOpen === "after") {
      setAfterDate(date);
    }
    setDatePickerOpen(null);
  };

  // ── Selector label ────────────────────────────────────────────────────────────

  const selectorLabel =
    target === "mine"
      ? t("progress.comparing_my_progress")
      : t("progress.comparing_partner_progress", { name: targetName });

  // ── Privacy gate (render partner-locked state) ────────────────────────────────

  const showPrivacyGate = target === "partner" && partnerPrivacyOn;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <VStack className="gap-4">
      {/* Target selector — StreakView pattern */}
      {hasPartner && (
        <Pressable
          onPress={handleTargetToggle}
          className="rounded-2xl h-[52px] px-4 flex-row items-center justify-between bg-[#EEF0F6] dark:bg-background-dark"
        >
          <Text
            className="text-typography-900 dark:text-white font-bold text-sm flex-1 mr-2"
            numberOfLines={1}
          >
            {selectorLabel}
          </Text>
          <Icon as={Repeat} className="text-typography-500" />
        </Pressable>
      )}

      {/* Privacy gate */}
      {showPrivacyGate ? (
        <Box
          className={`rounded-3xl border p-6 items-center justify-center bg-background-0 ${borderColor}`}
        >
          <Text className="text-typography-400 text-sm text-center">
            {t("progress.partner_privacy_on", {
              name: partnerFirstName ?? "Partner",
            })}
          </Text>
        </Box>
      ) : (
        <>
          {/* Date pickers */}
          <HStack className="gap-3">
            <DatePickerButton
              label={t("progress.before")}
              date={beforeDate}
              onPress={() => setDatePickerOpen("before")}
              colorScheme={colorScheme}
            />
            <DatePickerButton
              label={t("progress.after")}
              date={afterDate}
              onPress={() => setDatePickerOpen("after")}
              colorScheme={colorScheme}
            />
          </HStack>

          {/* Comparison rows */}
          <ComparisonCard
            viewLabel={t("progress.front_view")}
            beforePath={beforePhoto?.frontPhotoUrl ?? null}
            afterPath={afterPhoto?.frontPhotoUrl ?? null}
            isLoading={isLoading}
          />
          <ComparisonCard
            viewLabel={t("progress.side_view")}
            beforePath={beforePhoto?.sidePhotoUrl ?? null}
            afterPath={afterPhoto?.sidePhotoUrl ?? null}
            isLoading={isLoading}
          />
          <ComparisonCard
            viewLabel={t("progress.back_view")}
            beforePath={beforePhoto?.backPhotoUrl ?? null}
            afterPath={afterPhoto?.backPhotoUrl ?? null}
            isLoading={isLoading}
          />
        </>
      )}

      {/* Date picker ActionSheet */}
      <Actionsheet
        isOpen={datePickerOpen !== null}
        onClose={() => setDatePickerOpen(null)}
      >
        <ActionsheetBackdrop onPress={() => setDatePickerOpen(null)} />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <Text className="text-typography-800 dark:text-typography-100 font-semibold text-base mb-3">
            {datePickerOpen === "before"
              ? t("progress.before")
              : t("progress.after")}
          </Text>
          <View className="w-full mt-2 items-center h-[480px]">
            <Calendar
              mode="single"
              value={datePickerOpen === "before" ? beforeDate : afterDate}
              onValueChange={(selected: Date) => handleDateSelect(selected)}
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
          </View>
        </ActionsheetContent>
      </Actionsheet>
    </VStack>
  );
};
