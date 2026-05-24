import { apiClient } from '@/api/client'
import type { MealEntry, MealType } from '@/types/diary'

export type StoreFoodMealEntryPayload = {
  entry_mode: 'food'
  logged_for_date: string
  meal_type: MealType
  food_id: number
  food_serving_id?: number | null
  quantity?: number | null
  total_grams?: number | null
  notes?: string | null
}

export type StoreManualMealEntryPayload = {
  entry_mode: 'manual'
  logged_for_date: string
  meal_type: MealType
  manual_food_name: string
  serving_label?: string | null
  calories: number
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
  fiber_g?: number | null
  sugar_g?: number | null
  sodium_mg?: number | null
  notes?: string | null
}

export type StoreMealEntryPayload = StoreFoodMealEntryPayload | StoreManualMealEntryPayload

export function storeMealEntry(payload: StoreMealEntryPayload) {
  return apiClient.post<{
    meal_entry: MealEntry
  }>('/meal-entries', payload)
}
