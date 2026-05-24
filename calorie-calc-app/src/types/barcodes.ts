import type { Food, FoodNutritionPer100g } from '@/types/foods'

export type BarcodeMappedProduct = {
  barcode: string
  name: string
  generic_name?: string | null
  brand?: string | null
  quantity?: string | null
  serving_size?: string | null
  categories?: string | null
  countries?: string | null
  image_front_url?: string | null
  image_nutrition_url?: string | null
  nutrition_per_100g: FoodNutritionPer100g
  data_quality?: {
    has_calories: boolean
    has_macros: boolean
  }
}

export type BarcodeLookup = {
  barcode: string
  provider: string
  status: 'found' | 'not_found' | string
  status_verbose: string | null

  product_name: string | null
  brand: string | null

  mapped_product: BarcodeMappedProduct | null

  food_id: number | null
  food: Food | null

  last_fetched_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}
