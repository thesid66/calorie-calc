import { router, Stack } from 'expo-router'
import type { Href } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

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
    <Pressable onPress={handlePress} style={styles.backButton}>
      <View style={styles.backIcon}>
        <Text style={styles.backIconText}>‹</Text>
      </View>

      <Text style={styles.backText}>Back</Text>
    </Pressable>
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

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 12
  },
  backIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft
  },
  backIconText: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 28,
    marginTop: -2
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800'
  }
})
