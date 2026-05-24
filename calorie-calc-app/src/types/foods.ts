export type FoodServing = {
  id: number
  label: string
  grams: number
  is_default: boolean
}

export type FoodNutritionPer100g = {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number | null
  sugar_g: number | null
  sodium_mg: number | null
}

export type Food = {
  id: number
  name: string
  nepali_name: string | null
  brand: string | null
  barcode: string | null

  source: string
  food_type: string | null
  cuisine: string | null

  nutrition_per_100g: FoodNutritionPer100g

  is_verified: boolean
  is_public: boolean
  is_custom: boolean

  servings: FoodServing[]

  created_at?: string | null
  updated_at?: string | null
}

export type FoodPagination = {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export type FoodSearchResponse = {
  foods: Food[]
  pagination: FoodPagination
}
