import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { getMealEntry, updateMealEntry, type UpdateMealEntryPayload } from '@/api/mealEntries'
import {
  AppButton,
  AppCard,
  AppDatePicker,
  AppInput,
  appToast,
  Chip,
  ErrorCard,
  LoadingState,
  Screen,
  SectionHeader
} from '../../../components/ui'
import { colors } from '@/constants/colors'
import { macroTones, mealTones, radius, shadows, spacing, typography } from '@/constants/theme'
import type { MealEntry, MealType } from '@/types/diary'

const mealOptions: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: 'Breakfast' },
  { type: 'lunch', label: 'Lunch' },
  { type: 'dinner', label: 'Dinner' },
  { type: 'snack', label: 'Snack' }
]

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

function blurActiveElement() {
  if (typeof document === 'undefined') {
    return
  }

  const activeElement = document.activeElement as HTMLElement | null

  if (activeElement?.blur) {
    activeElement.blur()
  }
}

export default function EditMealEntryScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const mealEntryId = Number(params.id)

  const submittingRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [entry, setEntry] = useState<MealEntry | null>(null)

  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [loggedForDate, setLoggedForDate] = useState('')
  const [foodName, setFoodName] = useState('')
  const [servingLabel, setServingLabel] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [totalGrams, setTotalGrams] = useState('')

  const [calories, setCalories] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [carbsG, setCarbsG] = useState('')
  const [fatG, setFatG] = useState('')
  const [fiberG, setFiberG] = useState('')
  const [sugarG, setSugarG] = useState('')
  const [sodiumMg, setSodiumMg] = useState('')
  const [notes, setNotes] = useState('')

  const loadMealEntry = useCallback(async () => {
    if (!mealEntryId || Number.isNaN(mealEntryId)) {
      setFormError('Invalid meal entry.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const response = await getMealEntry(mealEntryId)
      const loadedEntry = response.data.meal_entry

      setEntry(loadedEntry)

      setMealType(loadedEntry.meal_type)
      setLoggedForDate(loadedEntry.logged_for_date)
      setFoodName(loadedEntry.food_name)
      setServingLabel(loadedEntry.serving_label ?? '')
      setQuantity(String(loadedEntry.quantity ?? 1))
      setTotalGrams(loadedEntry.total_grams ? String(loadedEntry.total_grams) : '')

      setCalories(String(loadedEntry.nutrition.calories ?? ''))
      setProteinG(String(loadedEntry.nutrition.protein_g ?? ''))
      setCarbsG(String(loadedEntry.nutrition.carbs_g ?? ''))
      setFatG(String(loadedEntry.nutrition.fat_g ?? ''))

      setFiberG(
        loadedEntry.nutrition.fiber_g !== null && loadedEntry.nutrition.fiber_g !== undefined
          ? String(loadedEntry.nutrition.fiber_g)
          : ''
      )

      setSugarG(
        loadedEntry.nutrition.sugar_g !== null && loadedEntry.nutrition.sugar_g !== undefined
          ? String(loadedEntry.nutrition.sugar_g)
          : ''
      )

      setSodiumMg(
        loadedEntry.nutrition.sodium_mg !== null && loadedEntry.nutrition.sodium_mg !== undefined
          ? String(loadedEntry.nutrition.sodium_mg)
          : ''
      )

      setNotes(loadedEntry.notes ?? '')
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message)
        appToast.error({ title: 'Could not load meal entry', message: error.message })
        return
      }

      setFormError('Could not load meal entry.')
      appToast.error({ title: 'Could not load meal entry', message: 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }, [mealEntryId])

  useEffect(() => {
    void loadMealEntry()
  }, [loadMealEntry])

  function isFoodMode() {
    return entry?.food_id !== null && entry?.food_id !== undefined
  }

  function hasFoodServing() {
    return (
      isFoodMode() &&
      entry?.serving_grams !== null &&
      entry?.serving_grams !== undefined &&
      Number(entry.serving_grams) > 0
    )
  }

  function validateForm(): string | null {
    if (!entry) {
      return 'Meal entry was not loaded.'
    }

    if (!loggedForDate.trim()) {
      return 'Date is required.'
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(loggedForDate.trim())) {
      return 'Date must be in YYYY-MM-DD format.'
    }

    if (isFoodMode()) {
      if (!entry.food_id) {
        return 'Food ID is missing.'
      }

      if (hasFoodServing()) {
        if (isInvalidRequiredNumber(quantity, 0.0001)) {
          return 'Quantity must be greater than 0.'
        }
      } else if (isInvalidRequiredNumber(totalGrams, 0.0001)) {
        return 'Total grams must be greater than 0.'
      }

      return null
    }

    if (foodName.trim().length < 2) {
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

  async function handleSave() {
    if (submittingRef.current) {
      return
    }

    setFormError(null)

    const validationError = validateForm()

    if (validationError) {
      setFormError(validationError)
      appToast.warning({ title: 'Check meal entry', message: validationError })
      return
    }

    if (!entry) {
      return
    }

    try {
      submittingRef.current = true
      setSaving(true)

      let payload: UpdateMealEntryPayload

      if (isFoodMode()) {
        payload = {
          entry_mode: 'food',
          logged_for_date: loggedForDate.trim(),
          meal_type: mealType,
          food_id: Number(entry.food_id),
          food_serving_id: null,
          quantity: hasFoodServing() ? toNumber(quantity) : null,
          total_grams: hasFoodServing() ? null : toNullableNumber(totalGrams),
          notes: notes.trim() || null
        }
      } else {
        payload = {
          entry_mode: 'manual',
          logged_for_date: loggedForDate.trim(),
          meal_type: mealType,
          manual_food_name: foodName.trim(),
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
      }

      await updateMealEntry(entry.id, payload)

      blurActiveElement()

      appToast.success({ title: 'Meal updated', message: 'Your diary entry was updated.' })

      router.push('/(tabs)/diary')
    } catch (error) {
      if (error instanceof ApiError) {
        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null
        const message = firstValidationError ?? error.message

        setFormError(message)
        appToast.error({ title: 'Could not update meal entry', message })

        return
      }

      setFormError('Could not update meal entry. Please try again.')
      appToast.error({ title: 'Could not update meal entry', message: 'Please try again.' })
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState message="Loading meal entry..." />
      </Screen>
    )
  }

  if (!entry) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Edit entry</Text>
          <Text style={styles.title}>Entry not found</Text>
          <Text style={styles.subtitle}>This meal entry could not be loaded.</Text>
        </View>

        {formError ? (
          <View style={styles.errorSpacing}>
            <ErrorCard title="Unable to edit" message={formError} />
          </View>
        ) : null}

        <AppButton title="Back to Diary" onPress={() => router.push('/(tabs)/diary')} />
      </Screen>
    )
  }

  const foodMode = isFoodMode()
  const mealTone = mealTones[mealType]

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{foodMode ? 'Database food' : 'Manual entry'}</Text>
        <Text style={styles.title}>Edit meal entry</Text>
        <Text style={styles.subtitle}>
          {foodMode
            ? 'Update the date, meal, quantity or notes for this saved food.'
            : 'Edit the food name, serving label, calories and macro values.'}
        </Text>
      </View>

      <View style={styles.entryHero}>
        <View style={[styles.entryHeroIcon, { backgroundColor: mealTone.soft }]}>
          <Text style={styles.entryHeroEmoji}>{mealTone.emoji}</Text>
        </View>

        <View style={styles.entryHeroCopy}>
          <Text style={styles.entryHeroLabel}>{mealTone.label}</Text>
          <Text style={styles.entryHeroTitle}>{foodName || entry.food_name}</Text>
          <Text style={styles.entryHeroMeta}>
            Current: {formatNumber(entry.nutrition.calories, ' kcal')}
          </Text>
        </View>
      </View>

      <AppCard gap={16} style={styles.card}>
        <SectionHeader title="Meal" />

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
      </AppCard>

      {foodMode ? (
        <AppCard gap={16} style={styles.card}>
          <SectionHeader
            title="Food entry details"
            subtitle="Nutrition comes from the saved food database record."
          />

          <View style={styles.form}>
            <AppDatePicker label="Date" value={loggedForDate} onChange={setLoggedForDate} />

            <AppInput
              label="Food name"
              value={foodName}
              onChangeText={setFoodName}
              placeholder="Food name"
              editable={false}
            />

            {hasFoodServing() ? (
              <>
                <AppInput
                  label="Serving label"
                  value={servingLabel}
                  onChangeText={setServingLabel}
                  placeholder="Serving label"
                  editable={false}
                />

                <AppInput
                  label="Quantity"
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="Example: 1"
                  keyboardType="numeric"
                />
              </>
            ) : (
              <AppInput
                label="Total grams"
                value={totalGrams}
                onChangeText={setTotalGrams}
                placeholder="Example: 150"
                keyboardType="numeric"
              />
            )}

            <AppInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional"
              multiline
            />
          </View>
        </AppCard>
      ) : (
        <>
          <AppCard gap={16} style={styles.card}>
            <SectionHeader
              title="Manual entry details"
              subtitle="These values are saved exactly as entered."
            />

            <View style={styles.form}>
              <AppDatePicker label="Date" value={loggedForDate} onChange={setLoggedForDate} />

              <AppInput
                label="Food name"
                value={foodName}
                onChangeText={setFoodName}
                placeholder="Example: homemade curry"
              />

              <AppInput
                label="Serving label"
                value={servingLabel}
                onChangeText={setServingLabel}
                placeholder="Example: 1 plate, 1 bowl"
              />

              <AppInput
                label="Notes"
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional"
                multiline
              />
            </View>
          </AppCard>

          <AppCard gap={16} style={styles.card}>
            <SectionHeader
              title="Manual nutrition"
              subtitle="Edit calories and macros directly for this entry."
            />

            <View style={styles.form}>
              <AppInput
                label="Calories"
                value={calories}
                onChangeText={setCalories}
                placeholder="Example: 450"
                keyboardType="numeric"
              />

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
            </View>
          </AppCard>
        </>
      )}

      {foodMode ? (
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Text style={styles.infoIconText}>ℹ</Text>
          </View>

          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>Food database entry</Text>
            <Text style={styles.infoText}>
              Calories and macros are recalculated from the saved food and quantity. Manual
              nutrition editing is only available for manual quick entries.
            </Text>
          </View>
        </View>
      ) : null}

      {!foodMode ? (
        <View style={styles.nutritionPreview}>
          <Text style={styles.previewLabel}>Updated preview</Text>

          <View style={styles.previewGrid}>
            <PreviewMetric
              label="Calories"
              value={formatNumber(toNullableNumber(calories), ' kcal')}
              color={colors.primary}
            />
            <PreviewMetric
              label="Protein"
              value={formatDecimal(toNullableNumber(proteinG), 'g')}
              color={macroTones.protein.color}
            />
            <PreviewMetric
              label="Carbs"
              value={formatDecimal(toNullableNumber(carbsG), 'g')}
              color={macroTones.carbs.color}
            />
            <PreviewMetric
              label="Fat"
              value={formatDecimal(toNullableNumber(fatG), 'g')}
              color={macroTones.fat.color}
            />
          </View>
        </View>
      ) : null}

      {formError ? (
        <View style={styles.errorSpacing}>
          <ErrorCard title="Please check meal entry" message={formError} />
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppButton title="Save changes" loading={saving} onPress={handleSave} />

        <AppButton
          title="Back to Diary"
          variant="secondary"
          onPress={() => router.push('/(tabs)/diary')}
        />
      </View>
    </Screen>
  )
}

function PreviewMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.previewMetric}>
      <View style={[styles.previewDot, { backgroundColor: color }]} />
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
  entryHero: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm
  },
  entryHeroIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center'
  },
  entryHeroEmoji: {
    fontSize: 25
  },
  entryHeroCopy: {
    flex: 1,
    gap: 2
  },
  entryHeroLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  entryHeroTitle: {
    color: colors.heading,
    fontSize: 18,
    fontWeight: '900'
  },
  entryHeroMeta: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900'
  },
  card: {
    marginBottom: spacing.lg
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
  infoCard: {
    backgroundColor: colors.cardWarm,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoIconText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900'
  },
  infoCopy: {
    flex: 1,
    gap: spacing.xs
  },
  infoTitle: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900'
  },
  infoText: {
    color: colors.mutedDark,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600'
  },
  nutritionPreview: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm
  },
  previewLabel: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900'
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  previewMetric: {
    width: '48%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 3
  },
  previewDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginBottom: spacing.xs
  },
  previewMetricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900'
  },
  previewMetricValue: {
    color: colors.heading,
    fontSize: 15,
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
