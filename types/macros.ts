export type MacroMode = "cut" | "bulk" | "recomp";

export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extra_active";

export interface MacroCalculatorInput {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  mode: MacroMode;
  /** Cut only — calorie deficit percentage (0–50), default 20 */
  deficitPercent?: number;
  /** Bulk only — calorie surplus percentage (0–50), default 10 */
  surplusPercent?: number;
}

export interface MacroCalculatorResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  /** Positive = surplus, negative = deficit, 0 for recomp */
  calorieDelta: number;
}
