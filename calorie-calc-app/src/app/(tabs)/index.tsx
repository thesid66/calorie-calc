import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { getDiary } from '@/api/diary'
import { AppButton, AppCard, appToast, LoadingState, Screen } from '../../components/ui'
import { colors } from '@/constants/colors'
import { macroTones, mealTones, radius, shadows, spacing, typography } from '@/constants/theme'
import { useAuth } from '@/providers/AuthProvider'
import type { Diary, MealType } from '@/types/diary'

const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

function todayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatNumber(value: number | string | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return `0${suffix}`
  }

  return `${Math.round(Number(value))}${suffix}`
}

function progressPercent(current: number, target: number | null | undefined) {
  if (!target || target <= 0) {
    return 0
  }

  return Math.min(Math.max((current / target) * 100, 0), 100)
}

function totalMealCalories(diary: Diary | null, mealType: MealType) {
  return (
    diary?.meals[mealType].reduce((total, entry) => total + Number(entry.nutrition.calories), 0) ??
    0
  )
}

function greeting() {
  const hour = new Date().getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'

  return 'Good evening'
}

function firstName(name: string | null | undefined) {
  return name?.trim().split(' ')[0] || 'there'
}

function readableDate(date: string | undefined) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  }).format(new Date(`${date ?? todayDateString()}T00:00:00`))
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
      appToast.error({
        title: 'Could not load dashboard',
        message:
          error instanceof ApiError
            ? error.message
            : 'Please check your API connection and try again.'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const summary = diary?.summary
  const target = diary?.target
  const consumed = summary?.calories ?? 0
  const calorieTarget = target?.daily_calorie_target ?? 0
  const remaining = target?.remaining.calories ?? calorieTarget - consumed
  const calorieProgress = progressPercent(consumed, calorieTarget)
  const totalEntries = mealOrder.reduce(
    (total, mealType) => total + (diary?.meals[mealType].length ?? 0),
    0
  )
  const loggedMeals = mealOrder.filter(
    (mealType) => (diary?.meals[mealType].length ?? 0) > 0
  ).length

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState message="Loading dashboard..." />
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.date}>{readableDate(diary?.date)}</Text>
          <Text style={styles.title}>
            {greeting()}, {firstName(user?.name)} 👋
          </Text>
          <Text style={styles.subtitle}>Your daily nutrition command centre.</Text>
        </View>

        <Pressable style={styles.refreshButton} onPress={loadDashboard}>
          <Text style={styles.refreshText}>{refreshing ? '...' : 'Refresh'}</Text>
        </Pressable>
      </View>

      {!target ? (
        <AppCard variant="warning" style={styles.goalCard}>
          <Text style={styles.goalTitle}>No active goal found</Text>
          <Text style={styles.goalText}>
            Set your goal so we can show calorie and macro targets.
          </Text>
          <AppButton title="Set up goal" onPress={() => router.push('/onboarding/goal')} />
        </AppCard>
      ) : null}

      <View style={styles.heroCard}>
        <View style={styles.heroBubbleOne} />
        <View style={styles.heroBubbleTwo} />

        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>Calories</Text>
            <Text style={styles.heroValue}>{formatNumber(Math.abs(remaining))}</Text>
            <Text style={styles.heroSub}>
              {remaining >= 0 ? 'kcal left today' : 'kcal over target'}
            </Text>
          </View>

          <View style={styles.percentBadge}>
            <Text style={styles.percentValue}>{Math.round(calorieProgress)}%</Text>
            <Text style={styles.percentLabel}>used</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${calorieProgress}%` }]} />
        </View>

        <View style={styles.heroStats}>
          <HeroStat label="Consumed" value={formatNumber(consumed, ' kcal')} />
          <HeroStat label="Target" value={formatNumber(calorieTarget, ' kcal')} />
          <HeroStat label="Entries" value={`${totalEntries}`} />
        </View>
      </View>

      <View style={styles.actionGrid}>
        <QuickAction
          title="Add food"
          subtitle="Search foods"
          icon="+"
          onPress={() => router.push('/(tabs)/add-food')}
        />
        <QuickAction
          title="Scan"
          subtitle="Barcode"
          icon="▦"
          onPress={() => router.push('/meal/barcode')}
        />
        <QuickAction
          title="Manual"
          subtitle="Quick entry"
          icon="✎"
          onPress={() => router.push('/meal/manual')}
        />
        <QuickAction
          title="Progress"
          subtitle="Weight logs"
          icon="↗"
          onPress={() => router.push('/(tabs)/progress')}
        />
      </View>

      <SectionTitle title="Macros" subtitle="Your main targets for today" />

      <View style={styles.macroGrid}>
        <MacroCard
          label="Protein"
          value={summary?.protein_g ?? 0}
          target={target?.protein_target_g ?? 0}
          tone={macroTones.protein}
        />
        <MacroCard
          label="Carbs"
          value={summary?.carbs_g ?? 0}
          target={target?.carb_target_g ?? 0}
          tone={macroTones.carbs}
        />
        <MacroCard
          label="Fat"
          value={summary?.fat_g ?? 0}
          target={target?.fat_target_g ?? 0}
          tone={macroTones.fat}
        />
      </View>

      <View style={styles.sectionRow}>
        <SectionTitle title="Today’s meals" subtitle={`${loggedMeals}/4 meal slots logged`} />
        <Pressable style={styles.diaryButton} onPress={() => router.push('/(tabs)/diary')}>
          <Text style={styles.diaryButtonText}>Diary</Text>
        </Pressable>
      </View>

      <View style={styles.mealList}>
        {mealOrder.map((mealType) => {
          const entries = diary?.meals[mealType] ?? []
          const calories = totalMealCalories(diary, mealType)
          const tone = mealTones[mealType]
          const preview = entries
            .slice(0, 2)
            .map((entry) => entry.food_name)
            .join(', ')

          return (
            <Pressable
              key={mealType}
              style={styles.mealCard}
              onPress={() => router.push('/(tabs)/diary')}
            >
              <View style={[styles.mealIcon, { backgroundColor: tone.soft }]}>
                <Text style={styles.mealEmoji}>{tone.emoji}</Text>
              </View>

              <View style={styles.mealText}>
                <Text style={styles.mealTitle}>{tone.label}</Text>
                <Text style={styles.mealPreview} numberOfLines={1}>
                  {preview || 'No food logged yet'}
                </Text>
              </View>

              <View style={styles.mealCaloriesWrap}>
                <Text style={[styles.mealCalories, { color: tone.color }]}>
                  {formatNumber(calories)}
                </Text>
                <Text style={styles.mealKcal}>kcal</Text>
              </View>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>💡</Text>
        <View style={styles.tipTextWrap}>
          <Text style={styles.tipTitle}>
            {totalEntries > 0 ? 'You are building today’s picture' : 'Start your first log'}
          </Text>
          <Text style={styles.tipText}>
            {totalEntries > 0
              ? 'Keep logging meals so your calorie and macro summaries stay accurate.'
              : 'Add breakfast, lunch, dinner or a snack to see your daily summary come alive.'}
          </Text>
        </View>
      </View>
    </Screen>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatLabel}>{label}</Text>
      <Text style={styles.heroStatValue}>{value}</Text>
    </View>
  )
}

function QuickAction({
  title,
  subtitle,
  icon,
  onPress
}: {
  title: string
  subtitle: string
  icon: string
  onPress: () => void
}) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickIcon}>
        <Text style={styles.quickIconText}>{icon}</Text>
      </View>
      <View style={styles.quickText}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  )
}

function MacroCard({
  label,
  value,
  target,
  tone
}: {
  label: string
  value: number
  target: number
  tone: { color: string; soft: string }
}) {
  const percent = progressPercent(value, target)

  return (
    <View style={styles.macroCard}>
      <View style={[styles.macroDotWrap, { backgroundColor: tone.soft }]}>
        <View style={[styles.macroDot, { backgroundColor: tone.color }]} />
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>
        {formatNumber(value)}
        <Text style={styles.macroTarget}>/{formatNumber(target, 'g')}</Text>
      </Text>
      <View style={styles.smallTrack}>
        <View style={[styles.smallFill, { width: `${percent}%`, backgroundColor: tone.color }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  headerText: {
    flex: 1
  },
  date: {
    ...typography.tiny,
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 4
  },
  title: {
    ...typography.title,
    color: colors.heading
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4
  },
  refreshButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.sm
  },
  refreshText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900'
  },
  goalCard: {
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  goalTitle: {
    color: colors.heading,
    fontSize: 18,
    fontWeight: '900'
  },
  goalText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius['3xl'],
    padding: spacing['2xl'],
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.lg
  },
  heroBubbleOne: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.14)',
    top: -65,
    right: -55
  },
  heroBubbleTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.10)',
    bottom: -50,
    left: -35
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg
  },
  heroLabel: {
    color: colors.primarySoft,
    fontSize: 15,
    fontWeight: '900'
  },
  heroValue: {
    color: colors.white,
    fontSize: 58,
    lineHeight: 64,
    fontWeight: '900',
    letterSpacing: -2
  },
  heroSub: {
    color: colors.primarySoft,
    fontSize: 16,
    fontWeight: '800'
  },
  percentBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)'
  },
  percentValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900'
  },
  percentLabel: {
    color: colors.primarySoft,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  progressTrack: {
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
    marginTop: spacing.xl
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.white
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  heroStat: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.16)',
    padding: spacing.md
  },
  heroStatLabel: {
    color: colors.primarySoft,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  heroStatValue: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing['2xl']
  },
  quickAction: {
    width: '48%',
    minHeight: 82,
    borderRadius: radius['2xl'],
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickIconText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900'
  },
  quickText: {
    flex: 1
  },
  quickTitle: {
    color: colors.heading,
    fontSize: 15,
    fontWeight: '900'
  },
  quickSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md
  },
  sectionTitleWrap: {
    marginBottom: spacing.md
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.heading
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2
  },
  diaryButton: {
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md
  },
  diaryButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900'
  },
  macroGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing['2xl']
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm
  },
  macroDotWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm
  },
  macroDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  macroLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900'
  },
  macroValue: {
    color: colors.heading,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 4
  },
  macroTarget: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700'
  },
  smallTrack: {
    height: 7,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: spacing.md
  },
  smallFill: {
    height: '100%',
    borderRadius: radius.pill
  },
  mealList: {
    gap: spacing.md,
    marginBottom: spacing['2xl']
  },
  mealCard: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm
  },
  mealIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center'
  },
  mealEmoji: {
    fontSize: 24
  },
  mealText: {
    flex: 1
  },
  mealTitle: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900'
  },
  mealPreview: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3
  },
  mealCaloriesWrap: {
    alignItems: 'flex-end'
  },
  mealCalories: {
    fontSize: 18,
    fontWeight: '900'
  },
  mealKcal: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  tipCard: {
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardWarm,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl
  },
  tipIcon: {
    fontSize: 24
  },
  tipTextWrap: {
    flex: 1
  },
  tipTitle: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900'
  },
  tipText: {
    color: colors.mutedDark,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    marginTop: 4
  }
})
