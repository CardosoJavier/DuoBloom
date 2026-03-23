import { MacroCalculatorInput, MacroCalculatorResult } from "@/types/macros";
import { computeBMR, computeTDEE } from "./macros-utils";

/**
 * Body Recomposition Calculator — maintenance calories, highest protein
 * Protein: 2.4 g/kg · Fat: 0.8 g/kg · Carbs: remainder
 */
export function calculateRecomp(
  input: MacroCalculatorInput,
): MacroCalculatorResult {
  const { weightKg, activityLevel } = input;

  const bmr = computeBMR(input);
  const tdee = computeTDEE(bmr, activityLevel);
  const targetCalories = tdee;

  const protein = Math.round(weightKg * 2.4);
  const fat = Math.round(weightKg * 0.8);
  const carbCals = Math.max(0, targetCalories - protein * 4 - fat * 9);
  const carbs = Math.round(carbCals / 4);

  const totalCals = protein * 4 + carbs * 4 + fat * 9;

  return {
    bmr,
    tdee,
    targetCalories,
    protein,
    carbs,
    fat,
    proteinPercent:
      totalCals > 0 ? Math.round((protein * 4 * 100) / totalCals) : 0,
    carbsPercent: totalCals > 0 ? Math.round((carbs * 4 * 100) / totalCals) : 0,
    fatPercent: totalCals > 0 ? Math.round((fat * 9 * 100) / totalCals) : 0,
    calorieDelta: 0,
  };
}
