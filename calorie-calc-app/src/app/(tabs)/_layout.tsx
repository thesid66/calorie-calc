import { Redirect, Tabs } from 'expo-router'
import { Text } from 'react-native'

import { colors } from '@/constants/colors'
import { useAuth } from '@/providers/AuthProvider'

function TabIcon({ icon }: { icon: string }) {
  return <Text style={{ fontSize: 22 }}>{icon}</Text>
}

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Tabs
      screenOptions={{
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '800'
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: () => <TabIcon icon="🏠" />
        }}
      />

      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diary',
          tabBarIcon: () => <TabIcon icon="📒" />
        }}
      />

      <Tabs.Screen
        name="add-food"
        options={{
          title: 'Add Food',
          tabBarIcon: () => <TabIcon icon="➕" />
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: () => <TabIcon icon="📈" />
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: () => <TabIcon icon="⚙️" />
        }}
      />
    </Tabs>
  )
}
