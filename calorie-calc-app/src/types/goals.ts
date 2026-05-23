export type GoalType = 'lose' | 'maintain' | 'gain'

export type NutritionGoal = {
  id: number
  user_id: number
  goal_type: GoalType

  starting_weight_kg?: number | null
  target_weight_kg?: number | null
  target_date?: string | null

  bmr?: number | null
  tdee?: number | null
  target_calories?: number | null

  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null

  daily_calorie_adjustment?: number | null

  created_at?: string
  updated_at?: string
}

export type StoreNutritionGoalPayload = {
  activity_level_id: number
  goal_type: GoalType
  target_weight_kg: number | null
  target_date?: string | null
}
