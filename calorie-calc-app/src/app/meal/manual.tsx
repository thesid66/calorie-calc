import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { storeMealEntry, type StoreManualMealEntryPayload } from '@/api/mealEntries'
import {
  AppButton,
  AppCard,
  AppDatePicker,
  AppInput,
  appToast,
  Chip,
  ErrorCard,
  Screen
} from '../../components/ui'
import { colors } from '@/constants/colors'
import { macroTones, mealTones, radius, shadows, spacing, typography } from '@/constants/theme'
import type { MealType } from '@/types/diary'

const mealOptions: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: 'Breakfast' },
  { type: 'lunch', label: 'Lunch' },
  { type: 'dinner', label: 'Dinner' },
  { type: 'snack', label: 'Snack' }
]

function getSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

function isMealTypeParam(value: string | undefined): value is MealType {
  return ['breakfast', 'lunch', 'dinner', 'snack'].includes(value ?? '')
}

function isDateParam(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function todayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function toNumber(value: string): number {
  return Number(value.replace(',', '.').trim())
}

function toNullableNumber(value: string): number | null {
  const cleanValue = value.replace(',', '.').trim()

  if (!cleanValue) {
    return null
  }

  return Number(cleanValue)
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

function isInvalidRequiredNumber(value: string, min = 0) {
  if (!value.trim()) {
    return true
  }

  const numericValue = toNumber(value)

  return Number.isNaN(numericValue) || numericValue < min
}

function isInvalidOptionalNumber(value: string, min = 0) {
  if (!value.trim()) {
    return false
  }

  const numericValue = toNumber(value)

  return Number.isNaN(numericValue) || numericValue < min
}

function readableDate(dateString: string) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  }).format(new Date(`${dateString}T00:00:00`))
}

function blurActiveElement() {
  if (typeof document === 'undefined') {
    return
  }

  const activeElement = document.activeElement as HTMLElement | null

  if (activeElement?.blur) {
    activeElement.blur()
  }
}

export default function ManualEntryScreen() {
  const params = useLocalSearchParams<{
    date?: string | string[]
    mealType?: string | string[]
  }>()

  const paramDate = getSingleParam(params.date)
  const paramMealType = getSingleParam(params.mealType)

  const initialLoggedForDate = isDateParam(paramDate) ? paramDate : todayDateString()
  const initialMealType: MealType = isMealTypeParam(paramMealType) ? paramMealType : 'breakfast'

  const submittingRef = useRef(false)

  const [mealType, setMealType] = useState<MealType>(initialMealType)
  const [loggedForDate, setLoggedForDate] = useState(initialLoggedForDate)

  const [manualFoodName, setManualFoodName] = useState('')
  const [servingLabel, setServingLabel] = useState('1 serving')

  const [calories, setCalories] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [carbsG, setCarbsG] = useState('')
  const [fatG, setFatG] = useState('')
  const [fiberG, setFiberG] = useState('')
  const [sugarG, setSugarG] = useState('')
  const [sodiumMg, setSodiumMg] = useState('')
  const [notes, setNotes] = useState('')

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const selectedMealTone = mealTones[mealType]

  const preview = useMemo(
    () => ({
      calories: toNullableNumber(calories),
      protein: toNullableNumber(proteinG),
      carbs: toNullableNumber(carbsG),
      fat: toNullableNumber(fatG)
    }),
    [calories, proteinG, carbsG, fatG]
  )

  useEffect(() => {
    if (isDateParam(paramDate)) {
      setLoggedForDate(paramDate)
    }

    if (isMealTypeParam(paramMealType)) {
      setMealType(paramMealType)
    }
  }, [paramDate, paramMealType])

  function resetForm() {
    setManualFoodName('')
    setServingLabel('1 serving')
    setCalories('')
    setProteinG('')
    setCarbsG('')
    setFatG('')
    setFiberG('')
    setSugarG('')
    setSodiumMg('')
    setNotes('')
    setFormError(null)
  }

  function validateForm(): string | null {
    if (!loggedForDate.trim()) {
      return 'Date is required.'
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(loggedForDate.trim())) {
      return 'Date must be in YYYY-MM-DD format.'
    }

    if (manualFoodName.trim().length < 2) {
      return 'Food name must be at least 2 characters.'
    }

    if (isInvalidRequiredNumber(calories, 0)) {
      return 'Calories are required.'
    }

    const optionalNumbers = [
      { label: 'Protein', value: proteinG },
      { label: 'Carbs', value: carbsG },
      { label: 'Fat', value: fatG },
      { label: 'Fiber', value: fiberG },
      { label: 'Sugar', value: sugarG },
      { label: 'Sodium', value: sodiumMg }
    ]

    for (const item of optionalNumbers) {
      if (isInvalidOptionalNumber(item.value, 0)) {
        return `${item.label} cannot be negative or invalid.`
      }
    }

    return null
  }

  async function handleSaveManualEntry() {
    if (submittingRef.current) {
      return
    }

    setFormError(null)

    const validationError = validateForm()

    if (validationError) {
      setFormError(validationError)
      appToast.warning({ title: 'Check your entry', message: validationError })
      return
    }

    try {
      submittingRef.current = true
      setSaving(true)

      const payload: StoreManualMealEntryPayload = {
        entry_mode: 'manual',
        logged_for_date: loggedForDate.trim(),
        meal_type: mealType,
        manual_food_name: manualFoodName.trim(),
        serving_label: servingLabel.trim() || null,
        calories: toNumber(calories),
        protein_g: toNullableNumber(proteinG),
        carbs_g: toNullableNumber(carbsG),
        fat_g: toNullableNumber(fatG),
        fiber_g: toNullableNumber(fiberG),
        sugar_g: toNullableNumber(sugarG),
        sodium_mg: toNullableNumber(sodiumMg),
        notes: notes.trim() || null
      }

      await storeMealEntry(payload)

      blurActiveElement()

      appToast.success({
        title: 'Entry logged',
        message: `${payload.manual_food_name} was added to your diary.`
      })

      resetForm()

      router.push('/(tabs)/diary')
    } catch (error) {
      if (error instanceof ApiError) {
        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null
        const message = firstValidationError ?? error.message

        setFormError(message)
        appToast.error({ title: 'Could not log entry', message })

        return
      }

      setFormError('Could not log entry. Please try again.')
      appToast.error({ title: 'Could not log entry', message: 'Please try again.' })
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Manual entry</Text>
        <Text style={styles.title}>Quick food log</Text>
        <Text style={styles.subtitle}>
          Use this when the food is not in the database, or when you already know the calories and
          macros.
        </Text>
      </View>

      <View style={styles.contextCard}>
        <View style={[styles.contextIcon, { backgroundColor: selectedMealTone.soft }]}>
          <Text style={styles.contextEmoji}>{selectedMealTone.emoji}</Text>
        </View>

        <View style={styles.contextCopy}>
          <Text style={styles.contextLabel}>Logging to</Text>
          <Text style={styles.contextTitle}>
            {selectedMealTone.label} • {readableDate(loggedForDate)}
          </Text>
        </View>
      </View>

      <AppCard gap={18} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Meal details</Text>
          <Text style={styles.cardSubtitle}>Choose when and where this manual entry belongs.</Text>
        </View>

        <View style={styles.chipRow}>
          {mealOptions.map((option) => (
            <Chip
              key={option.type}
              label={option.label}
              selected={option.type === mealType}
              onPress={() => setMealType(option.type)}
            />
          ))}
        </View>

        <View style={styles.form}>
          <AppDatePicker label="Date" value={loggedForDate} onChange={setLoggedForDate} />

          <AppInput
            label="Food name"
            value={manualFoodName}
            onChangeText={setManualFoodName}
            placeholder="Example: homemade curry"
          />

          <AppInput
            label="Serving label"
            value={servingLabel}
            onChangeText={setServingLabel}
            placeholder="Example: 1 plate, 1 bowl, 1 serving"
          />

          <AppInput
            label="Calories"
            value={calories}
            onChangeText={setCalories}
            placeholder="Example: 450"
            keyboardType="numeric"
          />
        </View>
      </AppCard>

      <AppCard gap={18} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Nutrition values</Text>
          <Text style={styles.cardSubtitle}>
            Add macros if you know them. Empty fields are allowed.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <AppInput
                label="Protein"
                value={proteinG}
                onChangeText={setProteinG}
                placeholder="g"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.column}>
              <AppInput
                label="Carbs"
                value={carbsG}
                onChangeText={setCarbsG}
                placeholder="g"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <AppInput
                label="Fat"
                value={fatG}
                onChangeText={setFatG}
                placeholder="g"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.column}>
              <AppInput
                label="Fiber"
                value={fiberG}
                onChangeText={setFiberG}
                placeholder="g"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <AppInput
                label="Sugar"
                value={sugarG}
                onChangeText={setSugarG}
                placeholder="g"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.column}>
              <AppInput
                label="Sodium"
                value={sodiumMg}
                onChangeText={setSodiumMg}
                placeholder="mg"
                keyboardType="numeric"
              />
            </View>
          </View>

          <AppInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional"
            multiline
          />
        </View>
      </AppCard>

      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>Entry preview</Text>
          <Text style={styles.previewSubtitle}>This is what will be saved to your diary.</Text>
        </View>

        <View style={styles.previewGrid}>
          <PreviewMetric
            label="Calories"
            value={formatNumber(preview.calories, ' kcal')}
            color={colors.primary}
            softColor={colors.caloriesSoft}
          />

          <PreviewMetric
            label="Protein"
            value={formatDecimal(preview.protein, 'g')}
            color={macroTones.protein.color}
            softColor={macroTones.protein.soft}
          />

          <PreviewMetric
            label="Carbs"
            value={formatDecimal(preview.carbs, 'g')}
            color={macroTones.carbs.color}
            softColor={macroTones.carbs.soft}
          />

          <PreviewMetric
            label="Fat"
            value={formatDecimal(preview.fat, 'g')}
            color={macroTones.fat.color}
            softColor={macroTones.fat.soft}
          />
        </View>
      </View>

      {formError ? (
        <View style={styles.errorSpacing}>
          <ErrorCard title="Please check your entry" message={formError} />
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppButton title="Log manual entry" loading={saving} onPress={handleSaveManualEntry} />

        <AppButton
          title="Back to Add Food"
          variant="secondary"
          onPress={() => router.push('/(tabs)/add-food')}
        />
      </View>
    </Screen>
  )
}

function PreviewMetric({
  label,
  value,
  color,
  softColor
}: {
  label: string
  value: string
  color: string
  softColor: string
}) {
  return (
    <View style={styles.previewMetric}>
      <View style={[styles.previewIcon, { backgroundColor: softColor }]}>
        <View style={[styles.previewDot, { backgroundColor: color }]} />
      </View>

      <Text style={styles.previewMetricLabel}>{label}</Text>
      <Text style={styles.previewMetricValue}>{value}</Text>
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
  contextCard: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm
  },
  contextIcon: {
    width: 50,
    height: 50,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center'
  },
  contextEmoji: {
    fontSize: 24
  },
  contextCopy: {
    flex: 1
  },
  contextLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  contextTitle: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2
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
  form: {
    gap: spacing.md
  },
  twoColumn: {
    flexDirection: 'row',
    gap: spacing.md
  },
  column: {
    flex: 1
  },
  previewCard: {
    backgroundColor: colors.cardWarm,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm
  },
  previewHeader: {
    gap: 3
  },
  previewTitle: {
    color: colors.heading,
    fontSize: 18,
    fontWeight: '900'
  },
  previewSubtitle: {
    color: colors.mutedDark,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  previewMetric: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4
  },
  previewIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  previewDot: {
    width: 11,
    height: 11,
    borderRadius: 6
  },
  previewMetricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900'
  },
  previewMetricValue: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900'
  },
  errorSpacing: {
    marginBottom: spacing.lg
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.xl
  }
})
