import { API_BASE_URL } from '@/constants/config'
import { getToken } from '@/storage/tokenStorage'
import type { ApiErrorResponse, ApiResponse } from '@/types/api'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type ApiRequestOptions = {
  method?: RequestMethod
  body?: unknown
  token?: string | null
}

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

async function request<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const method = options.method ?? 'GET'
  const token = options.token ?? (await getToken())

  const headers: HeadersInit = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  })

  const json = (await response.json().catch(() => null)) as ApiResponse<T> | ApiErrorResponse | null

  if (!response.ok) {
    console.log('API ERROR:', {
      endpoint,
      status: response.status,
      response: json
    })

    throw new ApiError(json?.message ?? 'Something went wrong.', response.status, json?.errors)
  }

  if (!json) {
    throw new ApiError('Invalid API response.', response.status)
  }

  return json as ApiResponse<T>
}

export const apiClient = {
  get: <T>(endpoint: string, token?: string | null) =>
    request<T>(endpoint, { method: 'GET', token }),

  post: <T>(endpoint: string, body?: unknown, token?: string | null) =>
    request<T>(endpoint, { method: 'POST', body, token }),

  put: <T>(endpoint: string, body?: unknown, token?: string | null) =>
    request<T>(endpoint, { method: 'PUT', body, token }),

  patch: <T>(endpoint: string, body?: unknown, token?: string | null) =>
    request<T>(endpoint, { method: 'PATCH', body, token }),

  delete: <T>(endpoint: string, token?: string | null) =>
    request<T>(endpoint, { method: 'DELETE', token })
}
