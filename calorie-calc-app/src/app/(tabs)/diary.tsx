import { router, useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { getDiary } from '@/api/diary'
import { copyDayEntries, copyMealEntries, deleteMealEntry } from '@/api/mealEntries'
import {
  AppButton,
  AppCard,
  appToast,
  LoadingState,
  Screen,
  useAppConfirm
} from '../../components/ui'
import { colors } from '@/constants/colors'
import { macroTones, mealTones, radius, shadows, spacing, typography } from '@/constants/theme'
import type { Diary, MealEntry, MealType } from '@/types/diary'

const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack'
}

const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

function todayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + days)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatNumber(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return `0${suffix}`
  }

  return `${Math.round(Number(value))}${suffix}`
}

function formatDecimal(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return `0${suffix}`
  }

  return `${Number(value).toFixed(1)}${suffix}`
}

function mealCalories(entries: MealEntry[]) {
  return entries.reduce((total, entry) => total + Number(entry.nutrition.calories), 0)
}

function mealMacros(entries: MealEntry[]) {
  return entries.reduce(
    (total, entry) => {
      return {
        protein_g: total.protein_g + Number(entry.nutrition.protein_g),
        carbs_g: total.carbs_g + Number(entry.nutrition.carbs_g),
        fat_g: total.fat_g + Number(entry.nutrition.fat_g)
      }
    },
    {
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0
    }
  )
}

function progressPercent(current: number, target: number | null | undefined) {
  if (!target || target <= 0) {
    return 0
  }

  const percent = (current / target) * 100

  return Math.min(Math.max(percent, 0), 100)
}

function formatReadableDate(dateString: string) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    day: '2-digit',
    month: 'short'
  }).format(new Date(`${dateString}T00:00:00`))
}

function getRemainingLabel(remaining: number) {
  if (remaining < 0) {
    return 'kcal over target'
  }

  return 'kcal remaining'
}

export default function DiaryScreen() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null)
  const [copyingMealType, setCopyingMealType] = useState<MealType | null>(null)
  const [copyingDay, setCopyingDay] = useState(false)
  const [selectedDate, setSelectedDate] = useState(todayDateString())
  const [diary, setDiary] = useState<Diary | null>(null)
  const appConfirm = useAppConfirm()

  useFocusEffect(
    useCallback(() => {
      loadDiary(selectedDate)
    }, [selectedDate])
  )

  async function loadDiary(date: string) {
    try {
      setRefreshing(true)

      const response = await getDiary(date)

      setDiary(response.data)
    } catch (error) {
      if (error instanceof ApiError) {
        appToast.error({ title: 'Could not load diary', message: error.message })
        return
      }

      appToast.error({
        title: 'Could not load diary',
        message: 'Please check your API connection and try again.'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function confirmDeleteEntry(entry: MealEntry) {
    const confirmed = await appConfirm.danger({
      title: 'Delete meal entry?',
      message: `Delete ${entry.food_name} from your diary?`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })

    if (confirmed) {
      await handleDeleteEntry(entry.id)
    }
  }

  async function handleDeleteEntry(entryId: number) {
    try {
      setDeletingEntryId(entryId)

      await deleteMealEntry(entryId)

      appToast.success({
        title: 'Entry deleted',
        message: 'Meal entry was removed from your diary.'
      })

      await loadDiary(selectedDate)
    } catch (error) {
      if (error instanceof ApiError) {
        appToast.error({ title: 'Could not delete entry', message: error.message })
        return
      }

      appToast.error({ title: 'Could not delete entry', message: 'Please try again.' })
    } finally {
      setDeletingEntryId(null)
    }
  }

  async function handleCopyPreviousDay() {
    try {
      setCopyingDay(true)

      const fromDate = addDays(selectedDate, -1)

      const response = await copyDayEntries({
        from_date: fromDate,
        to_date: selectedDate
      })

      await loadDiary(selectedDate)

      if (response.data.copied_count === 0) {
        appToast.info({ title: 'Nothing to copy', message: `No meals found on ${fromDate}.` })
        return
      }

      appToast.success({
        title: 'Day copied',
        message: `${response.data.copied_count} item(s) copied from ${fromDate}.`
      })
    } catch (error) {
      if (error instanceof ApiError) {
        appToast.error({ title: 'Could not copy day', message: error.message })
        return
      }

      appToast.error({ title: 'Could not copy day', message: 'Please try again.' })
    } finally {
      setCopyingDay(false)
    }
  }

  async function handleCopyPreviousMeal(mealType: MealType) {
    try {
      setCopyingMealType(mealType)

      const fromDate = addDays(selectedDate, -1)

      const response = await copyMealEntries({
        from_date: fromDate,
        to_date: selectedDate,
        from_meal_type: mealType,
        to_meal_type: mealType
      })

      await loadDiary(selectedDate)

      if (response.data.copied_count === 0) {
        appToast.info({
          title: 'Nothing to copy',
          message: `No ${mealLabels[mealType].toLowerCase()} found on ${fromDate}.`
        })
        return
      }

      appToast.success({
        title: 'Meal copied',
        message: `${response.data.copied_count} item(s) copied from ${fromDate}.`
      })
    } catch (error) {
      if (error instanceof ApiError) {
        appToast.error({ title: 'Could not copy meal', message: error.message })
        return
      }

      appToast.error({ title: 'Could not copy meal', message: 'Please try again.' })
    } finally {
      setCopyingMealType(null)
    }
  }

  function goToPreviousDay() {
    setSelectedDate((currentDate) => addDays(currentDate, -1))
  }

  function goToNextDay() {
    setSelectedDate((currentDate) => addDays(currentDate, 1))
  }

  function goToToday() {
    setSelectedDate(todayDateString())
  }

  function goToAddFood(selectedMealType?: MealType) {
    router.push({
      pathname: '/(tabs)/add-food',
      params: {
        date: selectedDate,
        ...(selectedMealType ? { mealType: selectedMealType } : {})
      }
    })
  }

  const summary = diary?.summary
  const target = diary?.target

  const caloriesConsumed = summary?.calories ?? 0
  const calorieTarget = target?.daily_calorie_target ?? 0
  const caloriesRemaining = target?.remaining.calories ?? 0

  const calorieProgress = useMemo(
    () => progressPercent(caloriesConsumed, calorieTarget),
    [caloriesConsumed, calorieTarget]
  )

  const loggedMealsCount = mealOrder.filter((mealType) => {
    return (diary?.meals[mealType].length ?? 0) > 0
  }).length

  const totalEntries = mealOrder.reduce((total, mealType) => {
    return total + (diary?.meals[mealType].length ?? 0)
  }, 0)

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState message="Loading diary..." />
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Daily diary</Text>
          <Text style={styles.title}>Track your meals</Text>
          <Text style={styles.subtitle}>Review today’s food, macros and meal balance.</Text>
        </View>

        <Pressable style={styles.refreshButton} onPress={() => loadDiary(selectedDate)}>
          <Text style={styles.refreshText}>{refreshing ? '...' : 'Refresh'}</Text>
        </Pressable>
      </View>

      <View style={styles.dateCard}>
        <Pressable style={styles.dateButton} onPress={goToPreviousDay}>
          <Text style={styles.dateButtonText}>‹</Text>
        </Pressable>

        <View style={styles.dateCenter}>
          <Text style={styles.dateReadable}>{formatReadableDate(selectedDate)}</Text>
          <Text style={styles.dateLabel}>{selectedDate}</Text>

          {selectedDate !== todayDateString() ? (
            <Pressable onPress={goToToday}>
              <Text style={styles.todayLink}>Back to today</Text>
            </Pressable>
          ) : (
            <Text style={styles.todayText}>Today</Text>
          )}
        </View>

        <Pressable style={styles.dateButton} onPress={goToNextDay}>
          <Text style={styles.dateButtonText}>›</Text>
        </Pressable>
      </View>

      {!target ? (
        <AppCard variant="warning" style={styles.warningCard}>
          <Text style={styles.warningTitle}>No active goal found</Text>
          <Text style={styles.warningText}>
            Complete your goal setup to compare your diary against calorie and macro targets.
          </Text>

          <AppButton title="Set up goal" onPress={() => router.push('/onboarding/goal')} />
        </AppCard>
      ) : null}

      <View style={styles.summaryCard}>
        <View style={styles.summaryGlowOne} />
        <View style={styles.summaryGlowTwo} />

        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>Calories</Text>
            <Text style={styles.summaryValue}>{formatNumber(caloriesConsumed)}</Text>
            <Text style={styles.summarySubtext}>
              {formatNumber(Math.abs(caloriesRemaining))} {getRemainingLabel(caloriesRemaining)}
            </Text>
          </View>

          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeValue}>{Math.round(calorieProgress)}%</Text>
            <Text style={styles.summaryBadgeLabel}>used</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${calorieProgress}%` }]} />
        </View>

        <View style={styles.summaryStats}>
          <SummaryStat label="Target" value={formatNumber(calorieTarget, ' kcal')} />
          <SummaryStat label="Entries" value={`${totalEntries}`} />
          <SummaryStat label="Meals" value={`${loggedMealsCount}/4`} />
        </View>
      </View>

      <View style={styles.macroGrid}>
        <MacroCard
          label="Protein"
          consumed={summary?.protein_g ?? 0}
          target={target?.protein_target_g ?? 0}
          unit="g"
          tone={macroTones.protein}
        />

        <MacroCard
          label="Carbs"
          consumed={summary?.carbs_g ?? 0}
          target={target?.carb_target_g ?? 0}
          unit="g"
          tone={macroTones.carbs}
        />

        <MacroCard
          label="Fat"
          consumed={summary?.fat_g ?? 0}
          target={target?.fat_target_g ?? 0}
          unit="g"
          tone={macroTones.fat}
        />
      </View>

      <View style={styles.actionGrid}>
        <QuickAction
          title="Add food"
          subtitle="Search or favourite"
          icon="+"
          onPress={() => goToAddFood()}
        />

        <QuickAction
          title={copyingDay ? 'Copying...' : 'Copy day'}
          subtitle="Use yesterday"
          icon="↺"
          disabled={copyingDay}
          onPress={handleCopyPreviousDay}
        />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Meals</Text>
          <Text style={styles.sectionSubtitle}>
            {loggedMealsCount}/4 meal slots logged • {totalEntries} entries
          </Text>
        </View>
      </View>

      <View style={styles.mealList}>
        {mealOrder.map((mealType) => {
          const entries = diary?.meals[mealType] ?? []
          const calories = mealCalories(entries)
          const macros = mealMacros(entries)
          const tone = mealTones[mealType]

          return (
            <View key={mealType} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View style={styles.mealHeaderLeft}>
                  <View style={[styles.mealIcon, { backgroundColor: tone.soft }]}>
                    <Text style={styles.mealEmoji}>{tone.emoji}</Text>
                  </View>

                  <View style={styles.mealTitleWrap}>
                    <Text style={styles.mealTitle}>{tone.label}</Text>
                    <Text style={styles.mealSubtitle}>
                      {entries.length === 1 ? '1 item' : `${entries.length} items`}
                    </Text>
                  </View>
                </View>

                <View style={styles.mealCaloriesWrap}>
                  <Text style={[styles.mealCalories, { color: tone.color }]}>
                    {formatNumber(calories)}
                  </Text>
                  <Text style={styles.mealCaloriesLabel}>kcal</Text>
                </View>
              </View>

              <View style={styles.mealActionRow}>
                <Pressable
                  style={[styles.mealPillButton, { backgroundColor: tone.soft }]}
                  onPress={() => goToAddFood(mealType)}
                >
                  <Text style={[styles.mealPillText, { color: tone.color }]}>Add food</Text>
                </Pressable>

                <Pressable
                  disabled={copyingMealType === mealType}
                  style={styles.copyPillButton}
                  onPress={() => handleCopyPreviousMeal(mealType)}
                >
                  <Text style={styles.copyPillText}>
                    {copyingMealType === mealType ? 'Copying...' : 'Copy yesterday'}
                  </Text>
                </Pressable>
              </View>

              {entries.length > 0 ? (
                <View style={styles.entryList}>
                  {entries.map((entry) => (
                    <MealEntryCard
                      key={entry.id}
                      entry={entry}
                      deleting={deletingEntryId === entry.id}
                      toneColor={tone.color}
                      onDelete={() => confirmDeleteEntry(entry)}
                      onEdit={() =>
                        router.push({
                          pathname: '/meal/edit-entry/[id]',
                          params: {
                            id: String(entry.id)
                          }
                        })
                      }
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyMealBox}>
                  <Text style={styles.emptyMealTitle}>Nothing logged yet</Text>
                  <Text style={styles.emptyMealText}>
                    Add food to this meal or copy yesterday’s {tone.label.toLowerCase()}.
                  </Text>
                </View>
              )}

              <View style={styles.mealMacroRow}>
                <MealMacro
                  label="Protein"
                  value={macros.protein_g}
                  color={macroTones.protein.color}
                />
                <MealMacro label="Carbs" value={macros.carbs_g} color={macroTones.carbs.color} />
                <MealMacro label="Fat" value={macros.fat_g} color={macroTones.fat.color} />
              </View>
            </View>
          )
        })}
      </View>
    </Screen>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryStatLabel}>{label}</Text>
      <Text style={styles.summaryStatValue}>{value}</Text>
    </View>
  )
}

function QuickAction({
  title,
  subtitle,
  icon,
  disabled = false,
  onPress
}: {
  title: string
  subtitle: string
  icon: string
  disabled?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      disabled={disabled}
      style={[styles.quickAction, disabled ? styles.quickActionDisabled : null]}
      onPress={onPress}
    >
      <View style={styles.quickIcon}>
        <Text style={styles.quickIconText}>{icon}</Text>
      </View>

      <View style={styles.quickCopy}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  )
}

function MealEntryCard({
  entry,
  deleting,
  toneColor,
  onEdit,
  onDelete
}: {
  entry: MealEntry
  deleting: boolean
  toneColor: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <View style={styles.entryCard}>
      <View style={styles.entryMain}>
        <Text style={styles.entryTitle}>{entry.food_name}</Text>

        <Text style={styles.entryMeta}>
          {formatDecimal(entry.quantity)}
          {entry.serving_label ? ` × ${entry.serving_label}` : ''}
          {entry.total_grams ? ` • ${formatDecimal(entry.total_grams, 'g')}` : ''}
        </Text>

        {entry.notes ? <Text style={styles.entryNotes}>{entry.notes}</Text> : null}

        <View style={styles.entryActions}>
          <Pressable style={styles.editButton} onPress={onEdit}>
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={onDelete} disabled={deleting}>
            <Text style={styles.deleteButtonText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.entryRight}>
        <Text style={[styles.entryCalories, { color: toneColor }]}>
          {formatNumber(entry.nutrition.calories)}
        </Text>
        <Text style={styles.entryCaloriesLabel}>kcal</Text>
      </View>
    </View>
  )
}

function MacroCard({
  label,
  consumed,
  target,
  unit,
  tone
}: {
  label: string
  consumed: number
  target: number
  unit: string
  tone: { color: string; soft: string }
}) {
  const percent = progressPercent(consumed, target)

  return (
    <View style={styles.macroCard}>
      <View style={[styles.macroDotWrap, { backgroundColor: tone.soft }]}>
        <View style={[styles.macroDot, { backgroundColor: tone.color }]} />
      </View>

      <Text style={styles.macroLabel}>{label}</Text>

      <Text style={styles.macroValue}>
        {formatNumber(consumed)}
        <Text style={styles.macroUnit}>/{formatNumber(target, unit)}</Text>
      </Text>

      <View style={styles.smallProgressTrack}>
        <View
          style={[styles.smallProgressFill, { width: `${percent}%`, backgroundColor: tone.color }]}
        />
      </View>
    </View>
  )
}

function MealMacro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.mealMacroPill}>
      <View style={[styles.mealMacroDot, { backgroundColor: color }]} />
      <Text style={styles.mealMacroText}>
        {label} {formatDecimal(value, 'g')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerCopy: {
    flex: 1,
    paddingRight: spacing.md
  },
  eyebrow: {
    ...typography.tiny,
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs
  },
  title: {
    ...typography.title,
    color: colors.heading
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs
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
  dateCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius['2xl'],
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm
  },
  dateButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dateButtonText: {
    fontSize: 30,
    lineHeight: 32,
    color: colors.primary,
    fontWeight: '900'
  },
  dateCenter: {
    alignItems: 'center',
    gap: 3
  },
  dateReadable: {
    color: colors.heading,
    fontSize: 17,
    fontWeight: '900'
  },
  dateLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  todayText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2
  },
  todayLink: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2
  },
  warningCard: {
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  warningTitle: {
    color: colors.heading,
    fontSize: 18,
    fontWeight: '900'
  },
  warningText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: radius['3xl'],
    padding: spacing['2xl'],
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.lg
  },
  summaryGlowOne: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    top: -65,
    right: -55
  },
  summaryGlowTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -50,
    left: -35
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg
  },
  summaryLabel: {
    color: colors.primarySoft,
    fontSize: 15,
    fontWeight: '900'
  },
  summaryValue: {
    color: colors.white,
    fontSize: 54,
    lineHeight: 60,
    fontWeight: '900',
    letterSpacing: -1.5,
    marginTop: spacing.xs
  },
  summarySubtext: {
    color: colors.primarySoft,
    fontSize: 16,
    fontWeight: '800'
  },
  summaryBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryBadgeValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900'
  },
  summaryBadgeLabel: {
    color: colors.primarySoft,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  progressTrack: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: spacing.xl
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.pill
  },
  summaryStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  summaryStat: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    padding: spacing.md,
    gap: 2
  },
  summaryStatLabel: {
    color: colors.primarySoft,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  summaryStatValue: {
    color: colors.white,
    fontSize: 14,
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
    marginTop: spacing.xs
  },
  macroUnit: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700'
  },
  smallProgressTrack: {
    height: 7,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: spacing.md
  },
  smallProgressFill: {
    height: '100%',
    borderRadius: radius.pill
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing['2xl']
  },
  quickAction: {
    flex: 1,
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
  quickActionDisabled: {
    opacity: 0.65
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
  quickCopy: {
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
  sectionHeader: {
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
  mealList: {
    gap: spacing.md,
    marginBottom: spacing['2xl']
  },
  mealCard: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'center'
  },
  mealHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
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
  mealTitleWrap: {
    flex: 1
  },
  mealTitle: {
    color: colors.heading,
    fontSize: 18,
    fontWeight: '900'
  },
  mealSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3
  },
  mealCaloriesWrap: {
    alignItems: 'flex-end'
  },
  mealCalories: {
    fontSize: 20,
    fontWeight: '900'
  },
  mealCaloriesLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  mealActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  mealPillButton: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  mealPillText: {
    fontSize: 13,
    fontWeight: '900'
  },
  copyPillButton: {
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  copyPillText: {
    color: colors.mutedDark,
    fontSize: 13,
    fontWeight: '900'
  },
  entryList: {
    gap: spacing.sm
  },
  entryCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between'
  },
  entryMain: {
    flex: 1,
    gap: 4
  },
  entryTitle: {
    color: colors.heading,
    fontSize: 15,
    fontWeight: '900'
  },
  entryMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700'
  },
  entryNotes: {
    color: colors.muted,
    fontSize: 12,
    fontStyle: 'italic'
  },
  entryRight: {
    alignItems: 'flex-end'
  },
  entryCalories: {
    fontSize: 19,
    fontWeight: '900'
  },
  entryCaloriesLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  entryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  editButton: {
    borderRadius: radius.pill,
    backgroundColor: colors.proteinSoft,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: spacing.md,
    paddingVertical: 6
  },
  editButtonText: {
    color: colors.protein,
    fontSize: 12,
    fontWeight: '900'
  },
  deleteButton: {
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: spacing.md,
    paddingVertical: 6
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900'
  },
  emptyMealBox: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    padding: spacing.lg,
    gap: spacing.xs
  },
  emptyMealTitle: {
    color: colors.heading,
    fontSize: 15,
    fontWeight: '900'
  },
  emptyMealText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700'
  },
  mealMacroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md
  },
  mealMacroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 7
  },
  mealMacroDot: {
    width: 7,
    height: 7,
    borderRadius: 4
  },
  mealMacroText: {
    color: colors.mutedDark,
    fontSize: 12,
    fontWeight: '900'
  }
})
