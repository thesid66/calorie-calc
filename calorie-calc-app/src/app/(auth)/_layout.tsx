import { Redirect, Stack } from 'expo-router'

import { useAuth } from '@/providers/AuthProvider'

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (!isLoading && isAuthenticated) {
    return <Redirect href="/(tabs)" />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false
      }}
    />
  )
}
