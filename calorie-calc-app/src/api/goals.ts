import { apiClient } from '@/api/client'
import type { NutritionGoal, StoreNutritionGoalPayload } from '@/types/goals'

export function getNutritionGoal() {
  return apiClient.get<{
    active_goal: NutritionGoal | null
  }>('/nutrition-goal')
}

export function storeNutritionGoal(payload: StoreNutritionGoalPayload) {
  return apiClient.post<{
    active_goal: NutritionGoal
  }>('/nutrition-goal', payload)
}
