import type { NutritionGoal } from '@/types/goals'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type MealEntryNutrition = {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number | null
  sugar_g: number | null
  sodium_mg: number | null
}

export type MealEntry = {
  id: number
  food_id: number | null
  logged_for_date: string
  meal_type: MealType
  food_name: string
  quantity: number
  serving_label: string | null
  serving_grams: number | null
  total_grams: number | null
  nutrition: MealEntryNutrition
  notes: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type DiarySummary = {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  sugar_g: number
  sodium_mg: number
}

export type DiaryRemaining = {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export type DiaryTarget = {
  daily_calorie_target: number
  protein_target_g: number
  carb_target_g: number
  fat_target_g: number
  remaining: DiaryRemaining
}

export type DiaryMeals = Record<MealType, MealEntry[]>

export type Diary = {
  date: string
  meals: DiaryMeals
  summary: DiarySummary
  target: DiaryTarget | null
  active_goal: NutritionGoal | null
}
