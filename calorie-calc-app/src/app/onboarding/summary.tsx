import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { getNutritionGoal } from '@/api/goals'
import { AppButton, AppCard, ErrorCard, LoadingState, Screen } from '@/components/ui'
import { colors } from '@/constants/colors'
import { macroTones, radius, shadows, spacing, typography } from '@/constants/theme'
import type { NutritionGoal } from '@/types/goals'

function formatNumber(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-'
  }

  return `${Math.round(Number(value))}${suffix}`
}

function formatDecimal(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
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

function goalHelper(goalType: NutritionGoal['goal_type']) {
  if (goalType === 'lose') {
    return 'A calorie deficit has been calculated to support gradual weight loss.'
  }

  if (goalType === 'gain') {
    return 'A calorie surplus has been calculated to support gradual weight gain.'
  }

  return 'Your calorie target is close to your estimated daily energy needs.'
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
          <Text style={styles.eyebrow}>Step 3 of 3</Text>
          <Text style={styles.title}>Goal summary</Text>
          <Text style={styles.subtitle}>
            No active nutrition goal was found. Please create your goal first.
          </Text>
        </View>

        <View style={styles.errorSpacing}>
          <ErrorCard
            title="Goal missing"
            message="Your profile may be saved, but no active nutrition goal was found."
            variant="warning"
          />
        </View>

        <AppButton title="Go to goal setup" onPress={() => router.push('/onboarding/goal')} />
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Step 3 of 3</Text>
        <Text style={styles.title}>Your plan is ready</Text>
        <Text style={styles.subtitle}>
          These values are calculated from your profile, activity level and goal.
        </Text>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroBubbleOne} />
        <View style={styles.heroBubbleTwo} />

        <Text style={styles.heroLabel}>Daily calorie target</Text>
        <Text style={styles.heroValue}>{formatNumber(goal.daily_calorie_target)}</Text>
        <Text style={styles.heroSuffix}>kcal / day</Text>

        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaPill}>
            <Text style={styles.heroMetaText}>{goalLabel(goal.goal_type).toUpperCase()}</Text>
          </View>

          <View style={styles.heroMetaPill}>
            <Text style={styles.heroMetaText}>
              {goal.goal_type === 'maintain'
                ? 'NO WEEKLY RATE'
                : `${formatDecimal(goal.target_rate_kg_per_week, ' KG/WEEK')}`}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.macroGrid}>
        <MacroCard
          label="Protein"
          value={formatNumber(goal.protein_target_g)}
          suffix="g"
          color={macroTones.protein.color}
          softColor={macroTones.protein.soft}
        />

        <MacroCard
          label="Carbs"
          value={formatNumber(goal.carb_target_g)}
          suffix="g"
          color={macroTones.carbs.color}
          softColor={macroTones.carbs.soft}
        />

        <MacroCard
          label="Fat"
          value={formatNumber(goal.fat_target_g)}
          suffix="g"
          color={macroTones.fat.color}
          softColor={macroTones.fat.soft}
        />
      </View>

      <AppCard gap={16} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Goal details</Text>
          <Text style={styles.cardSubtitle}>{goalHelper(goal.goal_type)}</Text>
        </View>

        <View style={styles.summaryList}>
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

          <SummaryRow
            label="Activity multiplier"
            value={
              goal.activity_level?.multiplier
                ? `×${formatDecimal(Number(goal.activity_level.multiplier))}`
                : '-'
            }
          />
        </View>
      </AppCard>

      <AppCard gap={16} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Energy calculation</Text>
          <Text style={styles.cardSubtitle}>
            BMR is your base energy need. TDEE includes daily activity.
          </Text>
        </View>

        <View style={styles.energyGrid}>
          <EnergyCard label="BMR" value={formatNumber(goal.bmr)} />
          <EnergyCard label="TDEE" value={formatNumber(goal.tdee)} />
        </View>
      </AppCard>

      <View style={styles.noteCard}>
        <View style={styles.noteIcon}>
          <Text style={styles.noteIconText}>i</Text>
        </View>

        <View style={styles.noteCopy}>
          <Text style={styles.noteTitle}>Use this as a starting point</Text>
          <Text style={styles.noteText}>
            These numbers are calculated estimates. You can adjust your goal later based on real
            progress, weight logs and how your body responds.
          </Text>
        </View>
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

function EnergyCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.energyCard}>
      <View style={styles.energyIcon}>
        <View style={styles.energyDot} />
      </View>

      <Text style={styles.energyLabel}>{label}</Text>
      <Text style={styles.energyValue}>{value}</Text>
      <Text style={styles.energySuffix}>kcal</Text>
    </View>
  )
}

function MacroCard({
  label,
  value,
  suffix,
  color,
  softColor
}: {
  label: string
  value: string
  suffix: string
  color: string
  softColor: string
}) {
  return (
    <View style={styles.macroCard}>
      <View style={[styles.macroIcon, { backgroundColor: softColor }]}>
        <View style={[styles.macroDot, { backgroundColor: color }]} />
      </View>

      <Text style={styles.macroLabel}>{label}</Text>

      <View style={styles.macroValueRow}>
        <Text style={[styles.macroValue, { color }]}>{value}</Text>
        <Text style={styles.macroSuffix}>{suffix}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg
  },
  eyebrow: {
    ...typography.tiny,
    color: colors.primary,
    textTransform: 'uppercase'
  },
  title: {
    ...typography.title,
    color: colors.heading
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius['3xl'],
    padding: spacing['2xl'],
    marginBottom: spacing.lg,
    overflow: 'hidden',
    gap: spacing.xs,
    ...shadows.lg
  },
  heroBubbleOne: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    top: -65,
    right: -50
  },
  heroBubbleTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -50,
    left: -35
  },
  heroLabel: {
    color: colors.primarySoft,
    fontSize: 15,
    fontWeight: '900'
  },
  heroValue: {
    color: colors.white,
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: spacing.xs
  },
  heroSuffix: {
    color: colors.primarySoft,
    fontSize: 16,
    fontWeight: '900'
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md
  },
  heroMetaPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7
  },
  heroMetaText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900'
  },
  macroGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    ...shadows.sm
  },
  macroIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  macroDot: {
    width: 11,
    height: 11,
    borderRadius: 6
  },
  macroLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900'
  },
  macroValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2
  },
  macroValue: {
    fontSize: 24,
    fontWeight: '900'
  },
  macroSuffix: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4
  },
  card: {
    marginBottom: spacing.lg
  },
  cardHeader: {
    gap: 3
  },
  cardTitle: {
    color: colors.heading,
    fontSize: 18,
    fontWeight: '900'
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20
  },
  summaryList: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800'
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    color: colors.heading,
    fontSize: 14,
    fontWeight: '900'
  },
  energyGrid: {
    flexDirection: 'row',
    gap: spacing.md
  },
  energyCard: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4
  },
  energyIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.caloriesSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  energyDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.primary
  },
  energyLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900'
  },
  energyValue: {
    color: colors.heading,
    fontSize: 26,
    fontWeight: '900'
  },
  energySuffix: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  noteCard: {
    backgroundColor: colors.cardWarm,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    gap: spacing.md,
    flexDirection: 'row',
    marginBottom: spacing.lg
  },
  noteIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  noteIconText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900'
  },
  noteCopy: {
    flex: 1,
    gap: 4
  },
  noteTitle: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900'
  },
  noteText: {
    color: colors.mutedDark,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700'
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.xl
  },
  errorSpacing: {
    marginBottom: spacing.lg
  }
})
