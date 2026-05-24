import { apiClient } from '@/api/client'
import type { Diary } from '@/types/diary'

export function getDiary(date?: string) {
  const query = date ? `?date=${encodeURIComponent(date)}` : ''

  return apiClient.get<Diary>(`/diary${query}`)
}
