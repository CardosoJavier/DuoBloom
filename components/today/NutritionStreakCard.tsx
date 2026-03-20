import { getMonthlyMealCompletionDates } from "@/api/streak-api";
import { NutritionStreakWidget } from "@/components/meals/NutritionStreakWidget";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function NutritionStreakCard() {
  const { user } = useAuthStore();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fromDate = toDateKey(monthStart);
  const toDate = toDateKey(monthEnd);
  const displayMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data: completedDates = [] } = useQuery({
    queryKey: ["streak-monthly", user?.id, fromDate, toDate],
    queryFn: () =>
      getMonthlyMealCompletionDates(user!.id, fromDate, toDate).then(
        (r) => r.data ?? [],
      ),
    enabled: !!user?.id,
  });

  const completedSet = useMemo(() => new Set(completedDates), [completedDates]);
  return (
    <NutritionStreakWidget
      completedDays={completedDates.length}
      completedSet={completedSet}
      selectedDate={displayMonth}
    />
  );
}
