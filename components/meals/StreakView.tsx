import {
  getAllCompletionDatesUntilToday,
  getMonthlyMealCompletionDates,
} from "@/api/streak-api";
import { DateNavigator } from "@/components/DateNavigator";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { CalendarDaysIcon, ChevronDownIcon, Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAppToast } from "@/hooks/use-app-toast";
import { useAuthStore } from "@/store/authStore";
import {
  CurrentStreakData,
  MonthlyStreakData,
  StreakSubject,
} from "@/types/streaks";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarGrid } from "./CalendarGrid";
import { StreakWidgets } from "./StreakWidgets";

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMonthBounds = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return { start, end };
};

const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const calculateCurrentStreak = (completionDates: string[]): number => {
  const completionSet = new Set(completionDates);
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  let streak = 0;
  while (completionSet.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const isSameMonth = (a: Date, b: Date): boolean => {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
};

export function StreakView() {
  const { t } = useTranslation();
  const toast = useAppToast();
  const { user, partner } = useAuthStore();

  const [selectedSubject, setSelectedSubject] = useState<StreakSubject>("self");
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const selectedUserId = selectedSubject === "self" ? user?.id : partner?.id;
  const selectedPartnerName = partner?.firstName || "Partner";
  const hasPartner = Boolean(partner?.id);
  const now = new Date();
  const disableNextMonth = isSameMonth(selectedDate, now);

  const subjectLabel =
    selectedSubject === "self"
      ? t("streak.my_streak")
      : t("streak.partner_streak", { name: selectedPartnerName });

  const handleSubjectToggle = () => {
    if (!hasPartner) return;
    setSelectedSubject((current) => (current === "self" ? "partner" : "self"));
  };

  const monthQuery = useQuery({
    queryKey: [
      "streak-month",
      selectedUserId,
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
    ],
    enabled: Boolean(selectedUserId),
    queryFn: async (): Promise<MonthlyStreakData> => {
      const { start, end } = getMonthBounds(selectedDate);
      const result = await getMonthlyMealCompletionDates(
        selectedUserId as string,
        start.toISOString(),
        end.toISOString(),
      );

      if (!result.success || !result.data) {
        throw result.error || new Error("Failed to load monthly streak");
      }

      const completedDays = result.data.length;
      const elapsedDays = isSameMonth(selectedDate, now)
        ? now.getDate()
        : getDaysInMonth(selectedDate);
      const completionPercent = Math.round(
        (completedDays / Math.max(elapsedDays, 1)) * 100,
      );

      return {
        completedDates: result.data,
        completedDays,
        elapsedDays,
        completionPercent,
      };
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  const allTimeQuery = useQuery({
    queryKey: ["streak-alltime", selectedUserId],
    enabled: Boolean(selectedUserId),
    queryFn: async (): Promise<CurrentStreakData> => {
      const result = await getAllCompletionDatesUntilToday(
        selectedUserId as string,
      );

      if (!result.success || !result.data) {
        throw result.error || new Error("Failed to load all-time streak");
      }

      return {
        days: calculateCurrentStreak(result.data),
      };
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  useEffect(() => {
    if (selectedSubject === "partner" && !hasPartner) {
      setSelectedSubject("self");
    }
  }, [selectedSubject, hasPartner]);

  useEffect(() => {
    if (!monthQuery.isError && !allTimeQuery.isError) return;

    const error = monthQuery.error || allTimeQuery.error;
    console.error("[StreakView] Query error:", error);
    toast.error(t("common.error"), t("streak.load_error"));
  }, [
    allTimeQuery.error,
    allTimeQuery.isError,
    monthQuery.error,
    monthQuery.isError,
    t,
    toast,
  ]);

  const monthlyData =
    monthQuery.data ||
    ({
      completedDates: [],
      completedDays: 0,
      elapsedDays: 1,
      completionPercent: 0,
    } as MonthlyStreakData);
  const currentStreakDays = allTimeQuery.data?.days ?? 0;

  const completedSet = useMemo(
    () => new Set(monthlyData.completedDates),
    [monthlyData.completedDates],
  );

  const isLoading = monthQuery.isPending || allTimeQuery.isPending;

  return (
    <VStack className="flex-1 gap-4 pb-2">
      <HStack className="w-full gap-4">
        <Box className="flex-2">
          <Pressable
            onPress={handleSubjectToggle}
            disabled={!hasPartner}
            className={`rounded-2xl h-[52px] px-4 flex-row items-center justify-between bg-[#EEF0F6] dark:bg-background-dark`}
          >
            <Text className="text-typography-900 dark:text-white font-bold text-md">
              {subjectLabel}
            </Text>
            <Icon as={ChevronDownIcon} className="text-typography-500" />
          </Pressable>
        </Box>

        <DateNavigator
          date={selectedDate}
          onDateChange={(newDate) =>
            setSelectedDate(
              new Date(newDate.getFullYear(), newDate.getMonth(), 1),
            )
          }
          className="flex-1"
          mode="month"
          disableNext={disableNextMonth}
          textSize="base"
        />
      </HStack>

      {!hasPartner && selectedSubject === "partner" && (
        <Text className="text-typography-500">{t("streak.no_partner")}</Text>
      )}

      {isLoading ? (
        <VStack className="gap-4">
          <Box className="rounded-[32px] border border-outline-200 dark:border-outline-800 bg-background-0 dark:bg-background-dark p-6 min-h-[500px]" />
          <HStack className="gap-4">
            <Box className="flex-1 rounded-3xl border border-outline-200 dark:border-outline-800 bg-background-0 dark:bg-background-dark h-[128px]" />
            <Box className="flex-1 rounded-3xl border border-outline-200 dark:border-outline-800 bg-background-0 dark:bg-background-dark h-[128px]" />
          </HStack>
        </VStack>
      ) : (
        <>
          <Box className="rounded-[32px] border border-outline-200 dark:border-outline-800 bg-background-0 dark:bg-background-dark p-6 min-h-[500px]">
            <HStack className="items-center gap-2 mb-4">
              <Icon
                as={CalendarDaysIcon}
                className="text-primary-500 w-5 h-5"
              />
              <Text className="text-typography-900 dark:text-white font-bold text-lg">
                {t("streak.nutrition_streak")}
              </Text>
            </HStack>

            <HStack className="items-end gap-2 mb-6">
              <Text className="text-typography-900 dark:text-white font-bold text-5xl leading-none tracking-tight">
                {monthlyData.completedDays}
              </Text>
              <Text className="text-typography-500 text-base font-medium mb-1">
                {t("streak.days_on_target")}
              </Text>
            </HStack>

            {monthlyData.completedDays === 0 && (
              <Text className="text-typography-500 mb-3">
                {t("streak.empty_month")}
              </Text>
            )}

            <CalendarGrid
              selectedDate={selectedDate}
              completedSet={completedSet}
            />
          </Box>

          <StreakWidgets
            currentStreakDays={currentStreakDays}
            completionPercent={monthlyData.completionPercent}
          />
        </>
      )}
    </VStack>
  );
}
