import type { ActivityLevel } from '@/types/profile'

export type GoalType = 'lose' | 'maintain' | 'gain'

export type NutritionGoal = {
  id: number
  goal_type: GoalType
  target_rate_kg_per_week: number | null

  bmr: number | null
  tdee: number | null
  daily_calorie_target: number | null

  protein_target_g: number | null
  carb_target_g: number | null
  fat_target_g: number | null

  activity_level?: ActivityLevel | null

  calculated_at?: string | null
  is_active: boolean
}

export type StoreNutritionGoalPayload = {
  activity_level_id: number
  goal_type: GoalType
  target_rate_kg_per_week?: number | null
}
