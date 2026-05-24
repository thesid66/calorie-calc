import { apiClient } from '@/api/client'
import type {
  NutritionProgressResponse,
  ProgressOverview,
  WeightProgressResponse
} from '@/types/progress'

type ProgressRangeParams = {
  from?: string
  to?: string
}

function buildRangeQuery(params: ProgressRangeParams = {}) {
  const queryParams = new URLSearchParams()

  if (params.from) {
    queryParams.set('from', params.from)
  }

  if (params.to) {
    queryParams.set('to', params.to)
  }

  const query = queryParams.toString()

  return query ? `?${query}` : ''
}

export function getProgressOverview(params: ProgressRangeParams = {}) {
  return apiClient.get<ProgressOverview>(`/progress/overview${buildRangeQuery(params)}`)
}

export function getWeightProgress(params: ProgressRangeParams = {}) {
  return apiClient.get<WeightProgressResponse>(`/progress/weight${buildRangeQuery(params)}`)
}

export function getNutritionProgress(params: ProgressRangeParams = {}) {
  return apiClient.get<NutritionProgressResponse>(`/progress/nutrition${buildRangeQuery(params)}`)
}
