import { apiClient } from '@/api/client'
import type { NutritionGoal, StoreNutritionGoalPayload } from '@/types/goals'

export function getNutritionGoal() {
  return apiClient.get<{
    nutrition_goal: NutritionGoal | null
  }>('/nutrition-goal')
}

export function storeNutritionGoal(payload: StoreNutritionGoalPayload) {
  return apiClient.post<{
    nutrition_goal: NutritionGoal
  }>('/nutrition-goal', payload)
}
