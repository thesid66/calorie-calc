import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AppToastHost } from '../components/ui'

import { AuthProvider } from '@/providers/AuthProvider'

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="meal" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <AppToastHost />
    </AuthProvider>
  )
}
