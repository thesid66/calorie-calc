import { apiClient } from '@/api/client'
import type { FoodSearchResponse } from '@/types/foods'

type SearchFoodsParams = {
  search?: string
  per_page?: number
  source?: string
  cuisine?: string
  verified_only?: boolean
}

export function searchFoods(params: SearchFoodsParams = {}) {
  const queryParams = new URLSearchParams()

  if (params.search) {
    queryParams.set('search', params.search)
  }

  if (params.per_page) {
    queryParams.set('per_page', String(params.per_page))
  }

  if (params.source) {
    queryParams.set('source', params.source)
  }

  if (params.cuisine) {
    queryParams.set('cuisine', params.cuisine)
  }

  if (params.verified_only) {
    queryParams.set('verified_only', '1')
  }

  const query = queryParams.toString()

  return apiClient.get<FoodSearchResponse>(`/foods${query ? `?${query}` : ''}`)
}
