import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { getNutritionGoal } from '@/api/goals'
import { AppButton, LoadingState, Screen } from '@/components/ui'
import { colors } from '@/constants/colors'
import type { NutritionGoal } from '@/types/goals'

function formatNumber(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined) {
    return '-'
  }

  return `${Math.round(Number(value))}${suffix}`
}

function formatDecimal(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined) {
    return '-'
  }

  return `${Number(value).toFixed(2)}${suffix}`
}

function goalLabel(goalType: NutritionGoal['goal_type']) {
  if (goalType === 'lose') {
    return 'Lose weight'
  }

  if (goalType === 'gain') {
    return 'Gain weight'
  }

  return 'Maintain weight'
}

export default function OnboardingSummaryScreen() {
  const [loading, setLoading] = useState(true)
  const [goal, setGoal] = useState<NutritionGoal | null>(null)

  async function loadGoalSummary() {
    try {
      setLoading(true)

      const response = await getNutritionGoal()

      setGoal(response.data.active_goal)
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('Could not load goal summary', error.message)
        return
      }

      Alert.alert('Could not load goal summary', 'Please check your API connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGoalSummary()
  }, [])

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState message="Loading your goal summary..." />
      </Screen>
    )
  }

  if (!goal) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.title}>Goal summary</Text>
          <Text style={styles.subtitle}>
            No active nutrition goal was found. Please create your goal first.
          </Text>
        </View>

        <AppButton title="Go to goal setup" onPress={() => router.push('/onboarding/goal')} />
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.emoji}>🎯</Text>
        <Text style={styles.title}>Your calorie target is ready</Text>
        <Text style={styles.subtitle}>
          These values are calculated from your profile, activity level and goal.
        </Text>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Daily calorie target</Text>
        <Text style={styles.heroValue}>{formatNumber(goal.daily_calorie_target)}</Text>
        <Text style={styles.heroSuffix}>kcal / day</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goal details</Text>

        <View style={styles.card}>
          <SummaryRow label="Goal" value={goalLabel(goal.goal_type)} />

          <SummaryRow
            label="Target rate"
            value={
              goal.goal_type === 'maintain'
                ? 'Maintain current weight'
                : formatDecimal(goal.target_rate_kg_per_week, ' kg/week')
            }
          />

          <SummaryRow label="Activity level" value={goal.activity_level?.name ?? '-'} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Energy calculation</Text>

        <View style={styles.metricGrid}>
          <MetricCard label="BMR" value={formatNumber(goal.bmr)} suffix="kcal" />

          <MetricCard label="TDEE" value={formatNumber(goal.tdee)} suffix="kcal" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily macro targets</Text>

        <View style={styles.macroGrid}>
          <MacroCard label="Protein" value={formatNumber(goal.protein_target_g)} suffix="g" />

          <MacroCard label="Carbs" value={formatNumber(goal.carb_target_g)} suffix="g" />

          <MacroCard label="Fat" value={formatNumber(goal.fat_target_g)} suffix="g" />
        </View>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Note</Text>
        <Text style={styles.noteText}>
          These numbers are calculated estimates. You can adjust your goal later based on real
          progress, weight logs and how your body responds.
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton title="Start tracking meals" onPress={() => router.replace('/(tabs)')} />

        <AppButton
          title="Edit goal"
          variant="secondary"
          onPress={() => router.push('/onboarding/goal')}
        />
      </View>
    </Screen>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  )
}

function MetricCard({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSuffix}>{suffix}</Text>
    </View>
  )
}

function MacroCard({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroSuffix}>{suffix}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    marginBottom: 22
  },
  emoji: {
    fontSize: 42
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.text
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24
  },
  heroLabel: {
    color: '#DCFCE7',
    fontSize: 15,
    fontWeight: '700'
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 54,
    fontWeight: '900',
    marginTop: 8
  },
  heroSuffix: {
    color: '#DCFCE7',
    fontSize: 16,
    fontWeight: '700'
  },
  section: {
    marginBottom: 22,
    gap: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600'
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    color: colors.text,
    fontSize: 14,
    fontWeight: '800'
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 12
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  },
  metricValue: {
    marginTop: 8,
    color: colors.text,
    fontSize: 28,
    fontWeight: '900'
  },
  metricSuffix: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 10
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
    fontWeight: '700'
  },
  macroValue: {
    marginTop: 8,
    color: colors.primary,
    fontSize: 26,
    fontWeight: '900'
  },
  macroSuffix: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2
  },
  noteCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 22,
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
  },
  actions: {
    gap: 12
  }
})
