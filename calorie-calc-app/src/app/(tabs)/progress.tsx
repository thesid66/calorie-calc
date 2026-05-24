import { useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { getProgressOverview } from '@/api/progress'
import { deleteWeightLog, getWeightLogs, storeWeightLog } from '@/api/weightLogs'
import {
  AppButton,
  AppCard,
  AppInput,
  Chip,
  ErrorCard,
  LoadingState,
  Screen,
  SectionHeader
} from '@/components/ui'
import { colors } from '@/constants/colors'
import type { ProgressOverview } from '@/types/progress'
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

export default function ProgressScreen() {
  const submittingRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRangeDays, setSelectedRangeDays] = useState(30)

  const [overview, setOverview] = useState<ProgressOverview | null>(null)
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([])

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

      const [overviewResponse, weightLogsResponse] = await Promise.all([
        getProgressOverview(range),
        getWeightLogs(range)
      ])

      setOverview(overviewResponse.data)
      setWeightLogs(weightLogsResponse.data.weight_logs)

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
  const progressToTarget = progressPercent(weight?.progress_to_target_percent)

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Track weight changes and nutrition trends over time.</Text>
        </View>

        <Pressable style={styles.refreshButton} onPress={loadProgress}>
          <Text style={styles.refreshText}>{refreshing ? '...' : 'Refresh'}</Text>
        </Pressable>
      </View>

      <AppCard style={styles.rangeCard}>
        <SectionHeader title="Range" subtitle={`${range.from} to ${range.to}`} />

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

      <AppCard variant="primary" style={styles.heroCard}>
        <Text style={styles.heroLabel}>Current weight</Text>
        <Text style={styles.heroValue}>{formatDecimal(weight?.current_weight_kg, ' kg')}</Text>

        <Text style={styles.heroSubtext}>
          Starting {formatDecimal(weight?.starting_weight_kg, ' kg')} • Target{' '}
          {formatDecimal(weight?.target_weight_kg, ' kg')}
        </Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressToTarget}%` }]} />
        </View>

        <Text style={styles.heroSubtext}>
          {formatNumber(weight?.progress_to_target_percent, '%')} to target
        </Text>
      </AppCard>

      <View style={styles.metricGrid}>
        <MetricCard
          label="Overall change"
          value={formatSignedDecimal(weight?.overall_change_kg, ' kg')}
        />

        <MetricCard
          label="Range change"
          value={formatSignedDecimal(weight?.change_in_range_kg, ' kg')}
        />
      </View>

      <AppCard>
        <SectionHeader
          title="Log weight"
          subtitle="One weight log per date. Saving again for the same date updates it."
        />

        <View style={styles.form}>
          <AppInput
            label="Date"
            value={loggedOn}
            onChangeText={setLoggedOn}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
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

        <ErrorCard title="Please check weight log" message={formError} />

        <AppButton title="Save weight log" loading={saving} onPress={handleSaveWeightLog} />
      </AppCard>

      <View style={styles.section}>
        <SectionHeader
          title="Weight history"
          subtitle={`${weightLogs.length} logs in selected range`}
        />

        {weightLogs.length === 0 ? (
          <AppCard variant="muted">
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
                      <Text style={styles.logDate}>{log.logged_on}</Text>
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

      <View style={styles.section}>
        <SectionHeader title="Nutrition trend" subtitle="Average intake for the selected range" />

        <View style={styles.metricGrid}>
          <MetricCard
            label="Avg calories"
            value={formatNumber(nutrition?.daily_average.calories, ' kcal')}
          />

          <MetricCard
            label="Avg protein"
            value={formatNumber(nutrition?.daily_average.protein_g, ' g')}
          />
        </View>

        <View style={styles.metricGrid}>
          <MetricCard
            label="Avg carbs"
            value={formatNumber(nutrition?.daily_average.carbs_g, ' g')}
          />

          <MetricCard label="Avg fat" value={formatNumber(nutrition?.daily_average.fat_g, ' g')} />
        </View>
      </View>
    </Screen>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <AppCard style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </AppCard>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 12,
    marginBottom: 20,
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
    lineHeight: 22,
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
  rangeCard: {
    marginBottom: 16
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  heroCard: {
    marginBottom: 16
  },
  heroLabel: {
    color: '#DCFCE7',
    fontSize: 15,
    fontWeight: '800'
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 46,
    fontWeight: '900'
  },
  heroSubtext: {
    color: '#DCFCE7',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 4
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 999
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  metricCard: {
    flex: 1
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800'
  },
  metricValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900'
  },
  form: {
    gap: 14
  },
  section: {
    gap: 12,
    marginTop: 20
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900'
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  logList: {
    gap: 10
  },
  logCard: {
    padding: 14
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
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
    color: colors.text,
    fontSize: 22,
    fontWeight: '900'
  },
  logNotes: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  deleteButton: {
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
