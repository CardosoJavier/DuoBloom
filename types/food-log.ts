export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export interface FoodItem {
  id: string;
  name: string;
  kcal: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  servingSize?: number;
  servingUnit?: string;
}

export interface MealSection {
  type: MealType;
  items: FoodItem[];
}

export interface MacroGoals {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface DailyNutritionGoal {
  kcal: number;
  macros: MacroGoals;
}

export interface FoodSearchResult {
  id: string;
  name: string;
  brand?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}
