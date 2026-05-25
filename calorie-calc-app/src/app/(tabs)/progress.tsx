import { useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { getNutritionProgress, getProgressOverview, getWeightProgress } from '@/api/progress'
import { deleteWeightLog, getWeightLogs, storeWeightLog } from '@/api/weightLogs'
import {
  AppButton,
  AppCard,
  AppDatePicker,
  AppInput,
  Chip,
  ErrorCard,
  LoadingState,
  Screen
} from '@/components/ui'
import { colors } from '@/constants/colors'
import { macroTones, radius, shadows, spacing, typography } from '@/constants/theme'
import type {
  NutritionProgressPoint,
  ProgressOverview,
  WeightProgressPoint
} from '@/types/progress'
import type { WeightLog } from '@/types/weightLogs'

type RangeOption = {
  label: string
  days: number
}

const rangeOptions: RangeOption[] = [
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 }
]

function todayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function dateDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - (days - 1))

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function toNumber(value: string): number {
  return Number(value.replace(',', '.').trim())
}

function formatNumber(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return `-${suffix}`
  }

  return `${Math.round(Number(value))}${suffix}`
}

function formatDecimal(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return `-${suffix}`
  }

  return `${Number(value).toFixed(1)}${suffix}`
}

function formatSignedDecimal(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return `-${suffix}`
  }

  const numberValue = Number(value)
  const sign = numberValue > 0 ? '+' : ''

  return `${sign}${numberValue.toFixed(1)}${suffix}`
}

function progressPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 0
  }

  return Math.min(Math.max(Number(value), 0), 100)
}

function sampleSeries<T>(series: T[], maxPoints = 14) {
  if (series.length <= maxPoints) {
    return series
  }

  return Array.from({ length: maxPoints }, (_, index) => {
    const sourceIndex = Math.round(index * ((series.length - 1) / (maxPoints - 1)))

    return series[sourceIndex]
  })
}

function getBarHeight(value: number, minValue: number, maxValue: number) {
  if (maxValue <= minValue) {
    return 50
  }

  const percent = ((value - minValue) / (maxValue - minValue)) * 100

  return Math.min(Math.max(percent, 8), 100)
}

function formatShortDate(dateString: string) {
  const [, month, day] = dateString.split('-')

  return `${day}/${month}`
}

function formatReadableDate(dateString: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(`${dateString}T00:00:00`))
}

export default function ProgressScreen() {
  const submittingRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRangeDays, setSelectedRangeDays] = useState(30)

  const [overview, setOverview] = useState<ProgressOverview | null>(null)
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([])
  const [weightSeries, setWeightSeries] = useState<WeightProgressPoint[]>([])
  const [nutritionSeries, setNutritionSeries] = useState<NutritionProgressPoint[]>([])

  const [loggedOn, setLoggedOn] = useState(todayDateString())
  const [weightKg, setWeightKg] = useState('')
  const [notes, setNotes] = useState('')

  const [saving, setSaving] = useState(false)
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const range = useMemo(
    () => ({
      from: dateDaysAgo(selectedRangeDays),
      to: todayDateString()
    }),
    [selectedRangeDays]
  )

  useFocusEffect(
    useCallback(() => {
      loadProgress()
    }, [range.from, range.to])
  )

  async function loadProgress() {
    try {
      setRefreshing(true)

      const [
        overviewResponse,
        weightLogsResponse,
        weightProgressResponse,
        nutritionProgressResponse
      ] = await Promise.all([
        getProgressOverview(range),
        getWeightLogs(range),
        getWeightProgress(range),
        getNutritionProgress(range)
      ])

      setOverview(overviewResponse.data)
      setWeightLogs(weightLogsResponse.data.weight_logs)
      setWeightSeries(weightProgressResponse.data.series)
      setNutritionSeries(nutritionProgressResponse.data.series)

      const latestLog = weightLogsResponse.data.weight_logs.at(-1)

      if (latestLog) {
        setWeightKg(String(latestLog.weight_kg))
      } else if (overviewResponse.data.weight.current_weight_kg) {
        setWeightKg(String(overviewResponse.data.weight.current_weight_kg))
      }
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('Could not load progress', error.message)
        return
      }

      Alert.alert('Could not load progress', 'Please check your API connection and try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function validateForm(): string | null {
    if (!loggedOn.trim()) {
      return 'Date is required.'
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(loggedOn.trim())) {
      return 'Date must be in YYYY-MM-DD format.'
    }

    if (!weightKg || toNumber(weightKg) < 20 || toNumber(weightKg) > 400) {
      return 'Weight must be between 20 and 400 kg.'
    }

    return null
  }

  async function handleSaveWeightLog() {
    if (submittingRef.current) {
      return
    }

    setFormError(null)

    const validationError = validateForm()

    if (validationError) {
      setFormError(validationError)
      Alert.alert('Check weight log', validationError)
      return
    }

    try {
      submittingRef.current = true
      setSaving(true)

      await storeWeightLog({
        logged_on: loggedOn.trim(),
        weight_kg: toNumber(weightKg),
        notes: notes.trim() || null
      })

      setNotes('')
      await loadProgress()
    } catch (error) {
      if (error instanceof ApiError) {
        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null
        const message = firstValidationError ?? error.message

        setFormError(message)
        Alert.alert('Could not save weight log', message)

        return
      }

      setFormError('Could not save weight log. Please try again.')
      Alert.alert('Could not save weight log', 'Please try again.')
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  function confirmDeleteWeightLog(log: WeightLog) {
    const message = `Delete weight log from ${log.logged_on}?`

    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (window.confirm(message)) {
        handleDeleteWeightLog(log.id)
      }

      return
    }

    Alert.alert('Delete weight log?', message, [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => handleDeleteWeightLog(log.id)
      }
    ])
  }

  async function handleDeleteWeightLog(logId: number) {
    try {
      setDeletingLogId(logId)

      await deleteWeightLog(logId)
      await loadProgress()
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('Could not delete weight log', error.message)
        return
      }

      Alert.alert('Could not delete weight log', 'Please try again.')
    } finally {
      setDeletingLogId(null)
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState message="Loading progress..." />
      </Screen>
    )
  }

  const weight = overview?.weight
  const nutrition = overview?.nutrition
  const goal = overview?.goal
  const progressToTarget = progressPercent(weight?.progress_to_target_percent)

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Body progress</Text>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Track weight changes and nutrition trends over time.</Text>
        </View>

        <Pressable style={styles.refreshButton} onPress={loadProgress}>
          <Text style={styles.refreshText}>{refreshing ? '...' : 'Refresh'}</Text>
        </Pressable>
      </View>

      <AppCard gap={16} style={styles.rangeCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Range</Text>
          <Text style={styles.cardSubtitle}>
            {formatReadableDate(range.from)} to {formatReadableDate(range.to)}
          </Text>
        </View>

        <View style={styles.chipRow}>
          {rangeOptions.map((option) => (
            <Chip
              key={option.days}
              label={option.label}
              selected={selectedRangeDays === option.days}
              onPress={() => setSelectedRangeDays(option.days)}
            />
          ))}
        </View>
      </AppCard>

      <View style={styles.heroCard}>
        <View style={styles.heroBubbleOne} />
        <View style={styles.heroBubbleTwo} />

        <Text style={styles.heroLabel}>Current weight</Text>
        <Text style={styles.heroValue}>{formatDecimal(weight?.current_weight_kg, ' kg')}</Text>

        <Text style={styles.heroSubtext}>
          Starting {formatDecimal(weight?.starting_weight_kg, ' kg')} • Target{' '}
          {formatDecimal(weight?.target_weight_kg, ' kg')}
        </Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressToTarget}%` }]} />
        </View>

        <View style={styles.heroFooter}>
          <Text style={styles.heroFooterText}>
            {formatNumber(weight?.progress_to_target_percent, '%')} to target
          </Text>

          {weight?.latest_logged_on ? (
            <Text style={styles.heroFooterText}>
              Updated {formatShortDate(weight.latest_logged_on)}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.metricGrid}>
        <MetricCard
          label="Overall change"
          value={formatSignedDecimal(weight?.overall_change_kg, ' kg')}
          helper="Since starting"
          tone="primary"
        />

        <MetricCard
          label="Range change"
          value={formatSignedDecimal(weight?.change_in_range_kg, ' kg')}
          helper={`${selectedRangeDays} day view`}
          tone="success"
        />
      </View>

      <WeightTrendCard series={weightSeries} />

      <AppCard gap={18} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Log weight</Text>
          <Text style={styles.cardSubtitle}>
            One weight log per date. Saving again for the same date updates it.
          </Text>
        </View>

        <View style={styles.form}>
          <AppDatePicker
            label="Date"
            value={loggedOn}
            onChange={setLoggedOn}
            maximumDate={new Date()}
            hint="Weight logs cannot be added for a future date."
          />

          <AppInput
            label="Weight"
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder="Weight in kg"
            keyboardType="numeric"
          />

          <AppInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional"
            multiline
          />
        </View>

        {formError ? <ErrorCard title="Please check weight log" message={formError} /> : null}

        <AppButton title="Save weight log" loading={saving} onPress={handleSaveWeightLog} />
      </AppCard>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weight history</Text>
          <Text style={styles.sectionSubtitle}>{weightLogs.length} logs in selected range</Text>
        </View>

        {weightLogs.length === 0 ? (
          <AppCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No weight logs yet</Text>
            <Text style={styles.emptyText}>
              Save your first weight log above to start tracking your progress.
            </Text>
          </AppCard>
        ) : (
          <View style={styles.logList}>
            {weightLogs
              .slice()
              .reverse()
              .map((log) => (
                <AppCard key={log.id} style={styles.logCard}>
                  <View style={styles.logRow}>
                    <View style={styles.logMain}>
                      <Text style={styles.logDate}>{formatReadableDate(log.logged_on)}</Text>
                      <Text style={styles.logWeight}>{formatDecimal(log.weight_kg, ' kg')}</Text>

                      {log.notes ? <Text style={styles.logNotes}>{log.notes}</Text> : null}
                    </View>

                    <Pressable
                      style={styles.deleteButton}
                      disabled={deletingLogId === log.id}
                      onPress={() => confirmDeleteWeightLog(log)}
                    >
                      <Text style={styles.deleteButtonText}>
                        {deletingLogId === log.id ? 'Deleting...' : 'Delete'}
                      </Text>
                    </Pressable>
                  </View>
                </AppCard>
              ))}
          </View>
        )}
      </View>

      <NutritionTrendCard
        series={nutritionSeries}
        calorieTarget={goal?.daily_calorie_target ?? null}
      />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nutrition average</Text>
          <Text style={styles.sectionSubtitle}>Average intake for the selected range</Text>
        </View>

        <View style={styles.metricGrid}>
          <MetricCard
            label="Avg calories"
            value={formatNumber(nutrition?.daily_average.calories, ' kcal')}
            helper={goal ? `Target ${goal.daily_calorie_target} kcal` : 'Daily average'}
            tone="calories"
          />

          <MetricCard
            label="Avg protein"
            value={formatNumber(nutrition?.daily_average.protein_g, ' g')}
            helper={goal ? `Target ${goal.protein_target_g}g` : 'Daily average'}
            tone="protein"
          />
        </View>

        <View style={styles.metricGrid}>
          <MetricCard
            label="Avg carbs"
            value={formatNumber(nutrition?.daily_average.carbs_g, ' g')}
            helper={goal ? `Target ${goal.carb_target_g}g` : 'Daily average'}
            tone="carbs"
          />

          <MetricCard
            label="Avg fat"
            value={formatNumber(nutrition?.daily_average.fat_g, ' g')}
            helper={goal ? `Target ${goal.fat_target_g}g` : 'Daily average'}
            tone="fat"
          />
        </View>
      </View>
    </Screen>
  )
}

function MetricCard({
  label,
  value,
  helper,
  tone
}: {
  label: string
  value: string
  helper: string
  tone: 'primary' | 'success' | 'calories' | 'protein' | 'carbs' | 'fat'
}) {
  const toneMap = {
    primary: {
      color: colors.primary,
      soft: colors.primarySoft
    },
    success: {
      color: colors.success,
      soft: colors.successSoft
    },
    calories: {
      color: colors.primary,
      soft: colors.caloriesSoft
    },
    protein: macroTones.protein,
    carbs: macroTones.carbs,
    fat: macroTones.fat
  }

  const selectedTone = toneMap[tone]

  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: selectedTone.soft }]}>
        <View style={[styles.metricDot, { backgroundColor: selectedTone.color }]} />
      </View>

      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricHelper}>{helper}</Text>
    </View>
  )
}

function WeightTrendCard({ series }: { series: WeightProgressPoint[] }) {
  const chartSeries = sampleSeries(series)
  const weights = chartSeries.map((point) => Number(point.weight_kg))
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 0

  return (
    <AppCard gap={16} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Weight trend</Text>
        <Text style={styles.cardSubtitle}>
          {series.length > 1
            ? `${series.length} weight points in selected range`
            : 'Add more weight logs to see your trend'}
        </Text>
      </View>

      {chartSeries.length > 1 ? (
        <>
          <View style={styles.chartWrapper}>
            {chartSeries.map((point) => {
              const height = getBarHeight(Number(point.weight_kg), minWeight, maxWeight)

              return (
                <View key={`${point.date}-${point.weight_kg}`} style={styles.chartItem}>
                  <View style={styles.chartBarTrack}>
                    <View
                      style={[
                        styles.weightChartBar,
                        {
                          height: `${height}%`
                        }
                      ]}
                    />
                  </View>
                </View>
              )
            })}
          </View>

          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>{formatShortDate(chartSeries[0].date)}</Text>
            <Text style={styles.chartLabel}>
              {formatShortDate(chartSeries[chartSeries.length - 1].date)}
            </Text>
          </View>

          <View style={styles.chartSummaryRow}>
            <Text style={styles.chartSummaryText}>Min {formatDecimal(minWeight, ' kg')}</Text>
            <Text style={styles.chartSummaryText}>Max {formatDecimal(maxWeight, ' kg')}</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyChartCard}>
          <Text style={styles.emptyText}>Add at least two weight logs to show a visual trend.</Text>
        </View>
      )}
    </AppCard>
  )
}

function NutritionTrendCard({
  series,
  calorieTarget
}: {
  series: NutritionProgressPoint[]
  calorieTarget: number | null
}) {
  const nonEmptySeries = series.filter((point) => Number(point.calories) > 0)
  const chartSeries = sampleSeries(nonEmptySeries)
  const calories = chartSeries.map((point) => Number(point.calories))
  const maxCalories = calories.length > 0 ? Math.max(...calories, calorieTarget ?? 0) : 0

  return (
    <AppCard gap={16} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Calories trend</Text>
        <Text style={styles.cardSubtitle}>
          {nonEmptySeries.length > 0
            ? `${nonEmptySeries.length} logged nutrition days in selected range`
            : 'Log meals to see calorie trends'}
        </Text>
      </View>

      {chartSeries.length > 0 ? (
        <>
          <View style={styles.chartWrapper}>
            {chartSeries.map((point) => {
              const height = getBarHeight(Number(point.calories), 0, maxCalories)

              return (
                <View key={`${point.date}-${point.calories}`} style={styles.chartItem}>
                  <View style={styles.chartBarTrack}>
                    <View
                      style={[
                        styles.calorieChartBar,
                        {
                          height: `${height}%`
                        }
                      ]}
                    />
                  </View>
                </View>
              )
            })}
          </View>

          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>{formatShortDate(chartSeries[0].date)}</Text>
            <Text style={styles.chartLabel}>
              {formatShortDate(chartSeries[chartSeries.length - 1].date)}
            </Text>
          </View>

          {calorieTarget ? (
            <Text style={styles.chartHint}>Target: {formatNumber(calorieTarget, ' kcal/day')}</Text>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyChartCard}>
          <Text style={styles.emptyText}>Log meals for a few days to see calorie trends here.</Text>
        </View>
      )}
    </AppCard>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm
  },
  refreshText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900'
  },
  rangeCard: {
    marginBottom: spacing.lg
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius['3xl'],
    padding: spacing['2xl'],
    marginBottom: spacing.lg,
    overflow: 'hidden',
    gap: spacing.sm,
    ...shadows.lg
  },
  heroBubbleOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    top: -60,
    right: -45
  },
  heroBubbleTwo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -45,
    left: -30
  },
  heroLabel: {
    color: colors.primarySoft,
    fontSize: 15,
    fontWeight: '900'
  },
  heroValue: {
    color: colors.white,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1
  },
  heroSubtext: {
    color: colors.primarySoft,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  },
  progressTrack: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: spacing.sm
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.pill
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xs
  },
  heroFooterText: {
    color: colors.primarySoft,
    fontSize: 13,
    fontWeight: '900'
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 4,
    ...shadows.sm
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  metricDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900'
  },
  metricValue: {
    color: colors.heading,
    fontSize: 24,
    fontWeight: '900'
  },
  metricHelper: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17
  },
  form: {
    gap: spacing.md
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  sectionHeader: {
    gap: 3
  },
  sectionTitle: {
    color: colors.heading,
    fontSize: 20,
    fontWeight: '900'
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  },
  emptyCard: {
    gap: spacing.xs
  },
  emptyTitle: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900'
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700'
  },
  logList: {
    gap: spacing.sm
  },
  logCard: {
    padding: spacing.md
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'flex-start'
  },
  logMain: {
    flex: 1,
    gap: 3
  },
  logDate: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800'
  },
  logWeight: {
    color: colors.heading,
    fontSize: 22,
    fontWeight: '900'
  },
  logNotes: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700'
  },
  deleteButton: {
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: spacing.sm,
    paddingVertical: 7
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900'
  },
  chartWrapper: {
    height: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: spacing.xs
  },
  chartItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end'
  },
  chartBarTrack: {
    flex: 1,
    justifyContent: 'flex-end',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden'
  },
  weightChartBar: {
    width: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary
  },
  calorieChartBar: {
    width: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.warning
  },
  chartLabels: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  chartLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  chartSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm
  },
  chartSummaryText: {
    color: colors.heading,
    fontSize: 13,
    fontWeight: '900'
  },
  chartHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.sm,
    fontWeight: '700'
  },
  emptyChartCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md
  }
})
