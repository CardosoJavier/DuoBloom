import { ActivityLevel, MacroCalculatorInput } from "@/types/macros";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

/**
 * Mifflin-St Jeor BMR formula
 * Male:   10w + 6.25h - 5a + 5
 * Female: 10w + 6.25h - 5a - 161
 */
export function computeBMR(
  input: Pick<MacroCalculatorInput, "weightKg" | "heightCm" | "age" | "sex">,
): number {
  const { weightKg, heightCm, age, sex } = input;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export function computeTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}
