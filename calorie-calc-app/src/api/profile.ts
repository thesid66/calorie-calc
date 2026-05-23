import { apiClient } from '@/api/client'
import type { UpdateProfilePayload, UserProfile } from '@/types/profile'

export function getProfile() {
  return apiClient.get<{
    profile: UserProfile | null
  }>('/profile')
}

export function updateProfile(payload: UpdateProfilePayload) {
  return apiClient.put<{
    profile: UserProfile
  }>('/profile', payload)
}
