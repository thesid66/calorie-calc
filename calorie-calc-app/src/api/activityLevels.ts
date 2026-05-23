import { apiClient } from '@/api/client'
import type { ActivityLevel } from '@/types/profile'

export function getActivityLevels() {
  return apiClient.get<{
    activity_levels: ActivityLevel[]
  }>('/activity-levels')
}
