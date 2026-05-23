import { apiClient } from '@/api/client'
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types/auth'

export function login(payload: LoginPayload) {
  return apiClient.post<AuthResponse>('/auth/login', payload, null)
}

export function register(payload: RegisterPayload) {
  return apiClient.post<AuthResponse>('/auth/register', payload, null)
}

export function getCurrentUser() {
  return apiClient.get<{ user: User }>('/auth/me')
}

export function logout() {
  return apiClient.post<null>('/auth/logout')
}
