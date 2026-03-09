import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

type CalendarCell = {
  key: string;
  day: number | null;
};

const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildCalendarCells = (displayMonth: Date): CalendarCell[] => {
  const firstWeekDay = new Date(
    displayMonth.getFullYear(),
    displayMonth.getMonth(),
    1,
  ).getDay();

  const daysInMonth = getDaysInMonth(displayMonth);
  const cells: CalendarCell[] = [];
  const timePrefix = displayMonth.getTime();

  for (let i = 0; i < firstWeekDay; i += 1) {
    cells.push({ key: `pad-start-${timePrefix}-${i}`, day: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ key: `day-${timePrefix}-${day}`, day });
  }

  let trailingIndex = 0;

  while (cells.length % 7 !== 0) {
    cells.push({ key: `pad-end-${timePrefix}-${trailingIndex}`, day: null });
    trailingIndex += 1;
  }

  return cells;
};

interface CalendarGridProps {
  readonly selectedDate: Date;
  readonly completedSet: Set<string>;
}

export function CalendarGrid({
  selectedDate,
  completedSet,
}: CalendarGridProps) {
  const { t } = useTranslation();
  const gridCells = useMemo(
    () => buildCalendarCells(selectedDate),
    [selectedDate],
  );

  const now = new Date();
  const todayKey = toDateKey(now);

  return (
    <Box className="w-full">
      <HStack className="justify-between mb-3 px-1">
        {weekdayLabels.map((day, ix) => (
          <Text
            key={`weekday-${ix}-${day}`}
            className="w-[12.5%] text-[10px] text-center text-typography-800 dark:text-typography-200 font-bold uppercase"
          >
            {day}
          </Text>
        ))}
      </HStack>

      <HStack className="flex-wrap gap-4 justify-between">
        {gridCells.map((cell) => {
          if (cell.day === null) {
            return (
              <Box
                key={cell.key}
                className="w-10 h-10"
                style={{ aspectRatio: 1 }}
              />
            );
          }

          const cellDate = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            cell.day,
          );

          cellDate.setHours(0, 0, 0, 0);

          const dateKey = toDateKey(cellDate);
          const isCompleted = completedSet.has(dateKey);
          const isToday = dateKey === todayKey;
          const isFuture =
            cellDate >
            new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const isMissed = !isCompleted && !isFuture;

          let cellStyle = "bg-background-200 dark:bg-background-800";

          if (isCompleted) {
            cellStyle = "bg-primary-500";
          } else if (isMissed) {
            cellStyle = "bg-background-200 dark:bg-background-700";
          }

          const dotColor = isCompleted
            ? "bg-white"
            : "bg-background-300 dark:bg-background-500";

          return (
            <Box
              key={cell.key}
              className={`w-10 h-10 rounded-lg items-center justify-center ${cellStyle}`}
              style={{ aspectRatio: 1 }}
            >
              {isToday && (
                <Box className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
              )}
            </Box>
          );
        })}
      </HStack>

      <HStack className="justify-end mt-6 gap-4 items-center px-1">
        <HStack className="items-center gap-1.5">
          <Box className="w-3 h-3 rounded bg-background-100 dark:bg-background-700" />
          <Text className="text-[10px] text-typography-400 dark:text-typography-500 font-medium">
            {t("streak.missed")}
          </Text>
        </HStack>
        <HStack className="items-center gap-1.5">
          <Box className="w-3 h-3 rounded bg-primary-500" />
          <Text className="text-[10px] text-typography-400 dark:text-typography-500 font-medium">
            {t("streak.goal_met")}
          </Text>
        </HStack>
      </HStack>
    </Box>
  );
}
