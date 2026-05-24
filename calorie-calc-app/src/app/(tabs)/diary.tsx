import { router, useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { getDiary } from '@/api/diary'
import { deleteMealEntry } from '@/api/mealEntries'
import { AppButton } from '@/components/ui/AppButton'
import { Screen } from '@/components/ui/Screen'
import { colors } from '@/constants/colors'
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

export default function DiaryScreen() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayDateString())
  const [diary, setDiary] = useState<Diary | null>(null)

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
        Alert.alert('Could not load diary', error.message)
        return
      }

      Alert.alert('Could not load diary', 'Please check your API connection and try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function confirmDeleteEntry(entry: MealEntry) {
    const message = `Delete ${entry.food_name} from your diary?`

    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (window.confirm(message)) {
        handleDeleteEntry(entry.id)
      }

      return
    }

    Alert.alert('Delete meal entry?', message, [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => handleDeleteEntry(entry.id)
      }
    ])
  }

  async function handleDeleteEntry(entryId: number) {
    try {
      setDeletingEntryId(entryId)

      await deleteMealEntry(entryId)

      await loadDiary(selectedDate)
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('Could not delete entry', error.message)
        return
      }

      Alert.alert('Could not delete entry', 'Please try again.')
    } finally {
      setDeletingEntryId(null)
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

  const summary = diary?.summary
  const target = diary?.target

  const caloriesConsumed = summary?.calories ?? 0
  const calorieTarget = target?.daily_calorie_target ?? 0
  const caloriesRemaining = target?.remaining.calories ?? 0

  const calorieProgress = useMemo(
    () => progressPercent(caloriesConsumed, calorieTarget),
    [caloriesConsumed, calorieTarget]
  )

  if (loading) {
    return (
      <Screen scroll={false}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading diary...</Text>
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Diary</Text>
          <Text style={styles.subtitle}>Track your meals and daily nutrition.</Text>
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
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>No active goal found</Text>
          <Text style={styles.warningText}>
            Complete your goal setup to compare your diary against calorie and macro targets.
          </Text>

          <AppButton title="Set up goal" onPress={() => router.push('/onboarding/goal')} />
        </View>
      ) : null}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Calories</Text>
        <Text style={styles.summaryValue}>
          {formatNumber(caloriesConsumed)}
          <Text style={styles.summaryTarget}> / {formatNumber(calorieTarget)} kcal</Text>
        </Text>

        <Text style={styles.summarySubtext}>{formatNumber(caloriesRemaining)} kcal remaining</Text>

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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meals</Text>

        <View style={styles.mealList}>
          {mealOrder.map((mealType) => {
            const entries = diary?.meals[mealType] ?? []
            const calories = mealCalories(entries)
            const macros = mealMacros(entries)

            return (
              <View key={mealType} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View>
                    <Text style={styles.mealTitle}>{mealLabels[mealType]}</Text>
                    <Text style={styles.mealSubtitle}>
                      {entries.length === 1 ? '1 item' : `${entries.length} items`}
                    </Text>
                  </View>

                  <View style={styles.mealHeaderRight}>
                    <Text style={styles.mealCalories}>{formatNumber(calories)} kcal</Text>
                    <Pressable onPress={() => router.push('/(tabs)/add-food')}>
                      <Text style={styles.addMealLink}>Add</Text>
                    </Pressable>
                  </View>
                </View>

                {entries.length > 0 ? (
                  <View style={styles.entryList}>
                    {entries.map((entry) => (
                      <MealEntryCard
                        key={entry.id}
                        entry={entry}
                        deleting={deletingEntryId === entry.id}
                        onDelete={() => confirmDeleteEntry(entry)}
                      />
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No food logged yet.</Text>
                )}

                <View style={styles.mealMacroRow}>
                  <Text style={styles.mealMacroText}>P {formatDecimal(macros.protein_g, 'g')}</Text>
                  <Text style={styles.mealMacroText}>C {formatDecimal(macros.carbs_g, 'g')}</Text>
                  <Text style={styles.mealMacroText}>F {formatDecimal(macros.fat_g, 'g')}</Text>
                </View>
              </View>
            )
          })}
        </View>
      </View>
    </Screen>
  )
}

function MealEntryCard({
  entry,
  deleting,
  onDelete
}: {
  entry: MealEntry
  deleting: boolean
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

        <Pressable style={styles.deleteButton} onPress={onDelete} disabled={deleting}>
          <Text style={styles.deleteButtonText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
        </Pressable>
      </View>

      <View style={styles.entryRight}>
        <Text style={styles.entryCalories}>{formatNumber(entry.nutrition.calories)}</Text>
        <Text style={styles.entryCaloriesLabel}>kcal</Text>
      </View>
    </View>
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
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.text
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
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
  dateCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 12,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dateButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dateButtonText: {
    fontSize: 28,
    lineHeight: 30,
    color: colors.text,
    fontWeight: '800'
  },
  dateCenter: {
    alignItems: 'center',
    gap: 4
  },
  dateLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '900'
  },
  todayText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  },
  todayLink: {
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
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 22,
    marginBottom: 16
  },
  summaryLabel: {
    color: '#DCFCE7',
    fontSize: 15,
    fontWeight: '800'
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    marginTop: 6
  },
  summaryTarget: {
    color: '#DCFCE7',
    fontSize: 18,
    fontWeight: '700'
  },
  summarySubtext: {
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
    marginBottom: 22
  },
  section: {
    gap: 12
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900'
  },
  mealList: {
    gap: 14
  },
  mealCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'flex-start'
  },
  mealTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  mealSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4
  },
  mealHeaderRight: {
    alignItems: 'flex-end',
    gap: 4
  },
  mealCalories: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900'
  },
  addMealLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900'
  },
  entryList: {
    gap: 10
  },
  entryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between'
  },
  entryMain: {
    flex: 1,
    gap: 4
  },
  entryTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900'
  },
  entryMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
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
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  entryCaloriesLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700'
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  mealMacroRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12
  },
  mealMacroText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800'
  },
  deleteButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: 999,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900'
  }
})
