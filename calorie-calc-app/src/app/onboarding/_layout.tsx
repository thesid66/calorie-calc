import { Stack } from 'expo-router'

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleStyle: {
          fontWeight: '800'
        }
      }}
    >
      <Stack.Screen
        name="profile"
        options={{
          title: 'Profile Setup'
        }}
      />

      <Stack.Screen
        name="goal"
        options={{
          title: 'Goal Setup'
        }}
      />

      <Stack.Screen
        name="summary"
        options={{
          title: 'Goal Summary'
        }}
      />
    </Stack>
  )
}
