import { apiClient } from '@/api/client'
import type { Food } from '@/types/foods'

export function getFoodFavorites() {
  return apiClient.get<{
    foods: Food[]
    food_ids: number[]
  }>('/food-favorites')
}

export function addFoodFavorite(foodId: number) {
  return apiClient.post<{
    food: Food
  }>(`/food-favorites/${foodId}`)
}

export function removeFoodFavorite(foodId: number) {
  return apiClient.delete<null>(`/food-favorites/${foodId}`)
}
