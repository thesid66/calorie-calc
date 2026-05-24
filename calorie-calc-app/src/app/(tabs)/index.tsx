import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { getDiary } from '@/api/diary'
import { AppButton } from '@/components/ui/AppButton'
import { Screen } from '@/components/ui/Screen'
import { colors } from '@/constants/colors'
import { useAuth } from '@/providers/AuthProvider'
import type { Diary, MealType } from '@/types/diary'

const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack'
}

function todayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatNumber(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return `0${suffix}`
  }

  return `${Math.round(Number(value))}${suffix}`
}

function progressPercent(current: number, target: number | null | undefined) {
  if (!target || target <= 0) {
    return 0
  }

  const percent = (current / target) * 100

  return Math.min(Math.max(percent, 0), 100)
}

function totalMealCalories(diary: Diary | null, mealType: MealType) {
  if (!diary) {
    return 0
  }

  return diary.meals[mealType].reduce((total, entry) => {
    return total + Number(entry.nutrition.calories)
  }, 0)
}

export default function DashboardScreen() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [diary, setDiary] = useState<Diary | null>(null)

  useFocusEffect(
    useCallback(() => {
      loadDashboard()
    }, [])
  )

  async function loadDashboard() {
    try {
      setRefreshing(true)

      const response = await getDiary(todayDateString())

      setDiary(response.data)
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('Could not load dashboard', error.message)
        return
      }

      Alert.alert('Could not load dashboard', 'Please check your API connection and try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const summary = diary?.summary
  const target = diary?.target

  const caloriesConsumed = summary?.calories ?? 0
  const calorieTarget = target?.daily_calorie_target ?? 0
  const caloriesRemaining = target?.remaining.calories ?? 0

  const calorieProgress = progressPercent(caloriesConsumed, calorieTarget)

  if (loading) {
    return (
      <Screen scroll={false}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {user?.name ?? 'there'} 👋</Text>
          <Text style={styles.subtitle}>{diary?.date ?? todayDateString()} summary</Text>
        </View>

        <Pressable style={styles.refreshButton} onPress={loadDashboard}>
          <Text style={styles.refreshText}>{refreshing ? '...' : 'Refresh'}</Text>
        </Pressable>
      </View>

      {!target ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>No active goal found</Text>
          <Text style={styles.warningText}>
            Complete your goal setup so the dashboard can show calorie and macro targets.
          </Text>

          <AppButton title="Set up goal" onPress={() => router.push('/onboarding/goal')} />
        </View>
      ) : null}

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Calories remaining</Text>

        <Text style={styles.heroValue}>{formatNumber(caloriesRemaining)}</Text>

        <Text style={styles.heroSubtext}>
          {formatNumber(caloriesConsumed)} consumed / {formatNumber(calorieTarget)} target
        </Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${calorieProgress}%` }]} />
        </View>
      </View>

      <View style={styles.macroGrid}>
        <MacroCard
          label="Protein"
          consumed={summary?.protein_g ?? 0}
          target={target?.protein_target_g ?? 0}
          unit="g"
        />

        <MacroCard
          label="Carbs"
          consumed={summary?.carbs_g ?? 0}
          target={target?.carb_target_g ?? 0}
          unit="g"
        />

        <MacroCard
          label="Fat"
          consumed={summary?.fat_g ?? 0}
          target={target?.fat_target_g ?? 0}
          unit="g"
        />
      </View>

      <View style={styles.actions}>
        <AppButton title="Add food" onPress={() => router.push('/(tabs)/add-food')} />

        <AppButton
          title="View diary"
          variant="secondary"
          onPress={() => router.push('/(tabs)/diary')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today’s meals</Text>

        <View style={styles.mealList}>
          {Object.entries(mealLabels).map(([mealType, label]) => {
            const typedMealType = mealType as MealType
            const entries = diary?.meals[typedMealType] ?? []
            const calories = totalMealCalories(diary, typedMealType)

            return (
              <Pressable
                key={mealType}
                style={styles.mealCard}
                onPress={() => router.push('/(tabs)/diary')}
              >
                <View>
                  <Text style={styles.mealTitle}>{label}</Text>
                  <Text style={styles.mealSubtitle}>
                    {entries.length === 1 ? '1 item' : `${entries.length} items`}
                  </Text>
                </View>

                <Text style={styles.mealCalories}>{formatNumber(calories)} kcal</Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Next</Text>
        <Text style={styles.noteText}>
          The dashboard is now connected to your diary. Next we’ll connect the Diary tab so it shows
          food entries grouped by breakfast, lunch, dinner and snacks.
        </Text>
      </View>
    </Screen>
  )
}

function MacroCard({
  label,
  consumed,
  target,
  unit
}: {
  label: string
  consumed: number
  target: number
  unit: string
}) {
  const percent = progressPercent(consumed, target)

  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroLabel}>{label}</Text>

      <Text style={styles.macroValue}>
        {formatNumber(consumed)}
        <Text style={styles.macroUnit}>/{formatNumber(target, unit)}</Text>
      </Text>

      <View style={styles.smallProgressTrack}>
        <View style={[styles.smallProgressFill, { width: `${percent}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  loadingText: {
    color: colors.muted,
    fontSize: 15
  },
  header: {
    gap: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  greeting: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    marginTop: 4
  },
  refreshButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  refreshText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800'
  },
  warningCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: 16,
    marginBottom: 18,
    gap: 12
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text
  },
  warningText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 26,
    padding: 24,
    marginBottom: 16
  },
  heroLabel: {
    color: '#DCFCE7',
    fontSize: 15,
    fontWeight: '800'
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 56,
    fontWeight: '900',
    marginTop: 6
  },
  heroSubtext: {
    color: '#DCFCE7',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 18
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 999
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14
  },
  macroLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800'
  },
  macroValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 8
  },
  macroUnit: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },
  smallProgressTrack: {
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 10
  },
  smallProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 999
  },
  actions: {
    gap: 12,
    marginBottom: 24
  },
  section: {
    gap: 12,
    marginBottom: 22
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900'
  },
  mealList: {
    gap: 10
  },
  mealCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center'
  },
  mealTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900'
  },
  mealSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4
  },
  mealCalories: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900'
  },
  noteCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6
  },
  noteTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900'
  },
  noteText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  }
})
