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

export type UpdateMealEntryPayload = StoreMealEntryPayload

export type CopyMealEntriesPayload = {
  from_date: string
  to_date: string
  from_meal_type: MealType
  to_meal_type?: MealType | null
}

export type CopyDayEntriesPayload = {
  from_date: string
  to_date: string
}

export function storeMealEntry(payload: StoreMealEntryPayload) {
  return apiClient.post<{
    meal_entry: MealEntry
  }>('/meal-entries', payload)
}

export function getMealEntry(mealEntryId: number) {
  return apiClient.get<{
    meal_entry: MealEntry
  }>(`/meal-entries/${mealEntryId}`)
}

export function updateMealEntry(mealEntryId: number, payload: UpdateMealEntryPayload) {
  return apiClient.put<{
    meal_entry: MealEntry
  }>(`/meal-entries/${mealEntryId}`, payload)
}

export function deleteMealEntry(mealEntryId: number) {
  return apiClient.delete<null>(`/meal-entries/${mealEntryId}`)
}

export function getRecentMealEntries(limit = 10) {
  return apiClient.get<{
    meal_entries: MealEntry[]
  }>(`/meal-entries/recent?limit=${limit}`)
}

export function copyMealEntries(payload: CopyMealEntriesPayload) {
  return apiClient.post<{
    copied_count: number
    meal_entries: MealEntry[]
  }>('/meal-entries/copy-meal', payload)
}

export function copyDayEntries(payload: CopyDayEntriesPayload) {
  return apiClient.post<{
    copied_count: number
    meal_entries: MealEntry[]
  }>('/meal-entries/copy-day', payload)
}
