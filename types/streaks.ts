export interface NutritionStreak {
  id: string;
  user_id: string;
  log_date: string;
  created_at: string;
}

export type StreakSubject = "self" | "partner";

export interface MonthlyStreakData {
  completedDates: string[];
  completedDays: number;
  elapsedDays: number;
  completionPercent: number;
}

export interface CurrentStreakData {
  days: number;
}
