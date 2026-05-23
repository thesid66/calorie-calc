export type User = {
  id: number
  name: string
  email: string
  email_verified_at?: string | null
  created_at?: string
  updated_at?: string
}

export type LoginPayload = {
  email: string
  password: string
  device_name: string
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
  password_confirmation: string
  device_name: string
}

export type AuthResponse = {
  user: User
  access_token: string
  token_type: string
}
