export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
  errors?: Record<string, string[]>
}

export type ApiErrorResponse = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
}
