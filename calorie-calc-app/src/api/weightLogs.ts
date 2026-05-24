import { apiClient } from '@/api/client'
import type {
  StoreWeightLogPayload,
  UpdateWeightLogPayload,
  WeightLog,
  WeightLogsResponse
} from '@/types/weightLogs'

type WeightLogRangeParams = {
  from?: string
  to?: string
}

function buildRangeQuery(params: WeightLogRangeParams = {}) {
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

export function getWeightLogs(params: WeightLogRangeParams = {}) {
  return apiClient.get<WeightLogsResponse>(`/weight-logs${buildRangeQuery(params)}`)
}

export function storeWeightLog(payload: StoreWeightLogPayload) {
  return apiClient.post<{
    weight_log: WeightLog
  }>('/weight-logs', payload)
}

export function getWeightLog(weightLogId: number) {
  return apiClient.get<{
    weight_log: WeightLog
  }>(`/weight-logs/${weightLogId}`)
}

export function updateWeightLog(weightLogId: number, payload: UpdateWeightLogPayload) {
  return apiClient.put<{
    weight_log: WeightLog
  }>(`/weight-logs/${weightLogId}`, payload)
}

export function deleteWeightLog(weightLogId: number) {
  return apiClient.delete<null>(`/weight-logs/${weightLogId}`)
}
