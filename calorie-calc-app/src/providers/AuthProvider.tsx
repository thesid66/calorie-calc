import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'

import * as authApi from '@/api/auth'
import { deleteToken, getToken, saveToken } from '@/storage/tokenStorage'
import type { LoginPayload, RegisterPayload, User } from '@/types/auth'

type AuthContextValue = {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (payload: LoginPayload) => Promise<void>
  signUp: (payload: RegisterPayload) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function bootstrapAuth() {
    try {
      const storedToken = await getToken()

      if (!storedToken) {
        setUser(null)
        setTokenState(null)
        return
      }

      setTokenState(storedToken)

      const response = await authApi.getCurrentUser()
      setUser(response.data.user)
    } catch {
      await deleteToken()
      setUser(null)
      setTokenState(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    bootstrapAuth()
  }, [])

  async function signIn(payload: LoginPayload) {
    const response = await authApi.login(payload)

    await saveToken(response.data.access_token)

    setTokenState(response.data.access_token)
    setUser(response.data.user)
  }

  async function signUp(payload: RegisterPayload) {
    const response = await authApi.register(payload)

    await saveToken(response.data.access_token)

    setTokenState(response.data.access_token)
    setUser(response.data.user)
  }

  async function signOut() {
    try {
      await authApi.logout()
    } finally {
      await deleteToken()
      setTokenState(null)
      setUser(null)
    }
  }

  async function refreshUser() {
    const response = await authApi.getCurrentUser()
    setUser(response.data.user)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      signIn,
      signUp,
      signOut,
      refreshUser
    }),
    [user, token, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}
