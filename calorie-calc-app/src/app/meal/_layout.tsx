import { router, Stack } from 'expo-router'
import type { Href } from 'expo-router'
import { HeaderBackButton } from 'expo-router/react-navigation'

import { colors } from '@/constants/colors'

function SmartBackButton({ fallbackHref }: { fallbackHref: Href }) {
  function handlePress() {
    if (router.canGoBack()) {
      router.back()
      return
    }

    router.replace(fallbackHref)
  }

  return (
    <HeaderBackButton
      onPress={handlePress}
      tintColor={colors.primary}
      label="Back"
      labelStyle={{
        color: colors.primary,
        fontWeight: '800'
      }}
    />
  )
}

export default function MealLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background
        },
        headerShadowVisible: false,
        headerTintColor: colors.primary,
        headerTitleStyle: {
          color: colors.heading,
          fontWeight: '900'
        }
      }}
    >
      <Stack.Screen
        name="manual"
        options={{
          title: 'Manual Quick Entry',
          headerLeft: () => <SmartBackButton fallbackHref="/(tabs)/add-food" />
        }}
      />

      <Stack.Screen
        name="barcode"
        options={{
          title: 'Barcode Lookup',
          headerLeft: () => <SmartBackButton fallbackHref="/(tabs)/add-food" />
        }}
      />

      <Stack.Screen
        name="custom-food"
        options={{
          title: 'Create Custom Food',
          headerLeft: () => <SmartBackButton fallbackHref="/(tabs)/add-food" />
        }}
      />

      <Stack.Screen
        name="edit-entry/[id]"
        options={{
          title: 'Edit Meal Entry',
          headerLeft: () => <SmartBackButton fallbackHref="/(tabs)/diary" />
        }}
      />
    </Stack>
  )
}
