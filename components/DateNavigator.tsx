import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
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
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Icon,
} from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";

import React, { useState } from "react";
import { useColorScheme, View } from "react-native";

export interface DateNavigatorProps {
  date: Date;
  onDateChange: (newDate: Date) => void;
  className?: string;
}

// Simple helper to check if a date is "Today"
const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  date,
  onDateChange,
  className,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark" || true;
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const prevDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const today = new Date();
  const isToday = isSameDay(date, today);

  const formattedDate = isToday
    ? "Today"
    : date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

  const handleCalendarSelection = (newDate: Date) => {
    onDateChange(newDate);
    setIsPickerOpen(false);
  };

  return (
    <>
      <HStack
        className={`rounded-2xl h-[52px] items-center justify-between px-2 ${
          isDark ? "bg-[#162032]" : "bg-[#EEF0F6]"
        } ${className || ""}`}
      >
        <Pressable
          onPress={prevDay}
          className="h-full px-4 items-center justify-center active:opacity-50"
        >
          <Icon as={ChevronLeftIcon} size="xl" className="text-slate-400" />
        </Pressable>

        <Pressable
          onPress={() => setIsPickerOpen(true)}
          className="flex-1 h-full items-center justify-center flex-row gap-2 active:opacity-50"
        >
          <Icon as={CalendarDaysIcon} size="md" className="text-slate-400" />
          <Text className="text-white font-bold text-base">
            {formattedDate}
          </Text>
        </Pressable>

        <Pressable
          onPress={nextDay}
          className="h-full px-4 items-center justify-center active:opacity-50"
        >
          <Icon as={ChevronRightIcon} size="xl" className="text-slate-400" />
        </Pressable>
      </HStack>

      <Actionsheet isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent className="bg-slate-900 border-t border-slate-800 rounded-t-3xl pt-2 pb-8">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator className="bg-slate-700" />
          </ActionsheetDragIndicatorWrapper>

          <View className="w-full mt-4 items-center h-[350px]">
            <Calendar
              mode="single"
              value={date}
              onValueChange={(selectedDate: Date) =>
                handleCalendarSelection(selectedDate)
              }
              className="w-full bg-slate-900 border-0 p-4"
            >
              <CalendarHeader className="flex-row justify-between w-full mb-4 px-2 items-center">
                <CalendarHeaderPrevButton className="bg-slate-800 rounded-lg h-10 w-10 active:bg-slate-700 items-center justify-center">
                  <Icon as={ChevronLeftIcon} className="text-slate-300" />
                </CalendarHeaderPrevButton>

                <CalendarHeaderTitle className="text-white font-bold" />

                <CalendarHeaderNextButton className="bg-slate-800 rounded-lg h-10 w-10 active:bg-slate-700 items-center justify-center">
                  <Icon as={ChevronRightIcon} className="text-slate-300" />
                </CalendarHeaderNextButton>
              </CalendarHeader>

              <CalendarWeekDaysHeader className="border-b border-slate-800 pb-2 mb-2 w-full" />

              <CalendarBody>
                <CalendarGrid className="w-full gap-2" />
              </CalendarBody>
            </Calendar>
          </View>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
};
