import { Stack } from 'expo-router'

import { colors } from '@/constants/colors'

export default function MealLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '900'
        }
      }}
    >
      <Stack.Screen
        name="manual"
        options={{
          title: 'Manual Quick Entry'
        }}
      />

      <Stack.Screen
        name="barcode"
        options={{
          title: 'Barcode Lookup'
        }}
      />

      <Stack.Screen
        name="custom-food"
        options={{
          title: 'Create Custom Food'
        }}
      />

      <Stack.Screen
        name="edit-entry/[id]"
        options={{
          title: 'Edit Meal Entry'
        }}
      />
    </Stack>
  )
}
