export type ProgressOverview = {
  range: {
    from: string
    to: string
    days: number
  }
  weight: {
    starting_weight_kg: number | null
    current_weight_kg: number | null
    target_weight_kg: number | null
    latest_logged_on: string | null
    change_in_range_kg: number | null
    overall_change_kg: number | null
    progress_to_target_percent: number | null
  }
  nutrition: {
    total: {
      calories: number
      protein_g: number
      carbs_g: number
      fat_g: number
      fiber_g: number
      sugar_g: number
      sodium_mg: number
    }
    daily_average: {
      calories: number
      protein_g: number
      carbs_g: number
      fat_g: number
    }
  }
  goal: {
    goal_type: 'lose' | 'maintain' | 'gain'
    daily_calorie_target: number
    protein_target_g: number
    carb_target_g: number
    fat_target_g: number
  } | null
}

export type WeightProgressPoint = {
  date: string
  weight_kg: number
  notes: string | null
}

export type WeightProgressResponse = {
  from: string
  to: string
  series: WeightProgressPoint[]
}

export type NutritionProgressPoint = {
  date: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  sugar_g: number
  sodium_mg: number
}

export type NutritionProgressResponse = {
  from: string
  to: string
  series: NutritionProgressPoint[]
}
