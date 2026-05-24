import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { getMealEntry, updateMealEntry, type UpdateMealEntryPayload } from '@/api/mealEntries'
import { AppButton } from '@/components/ui/AppButton'
import { AppInput } from '@/components/ui/AppInput'
import { Screen } from '@/components/ui/Screen'
import { colors } from '@/constants/colors'
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

  useEffect(() => {
    loadMealEntry()
  }, [mealEntryId])

  async function loadMealEntry() {
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
      setServingLabel(loadedEntry.serving_label ?? '1 serving')
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
        Alert.alert('Could not load meal entry', error.message)
        return
      }

      setFormError('Could not load meal entry.')
      Alert.alert('Could not load meal entry', 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function isFoodMode() {
    return entry?.food_id !== null && entry?.food_id !== undefined
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

      if (!entry.serving_label && !totalGrams.trim()) {
        return 'Total grams is required when serving information is missing.'
      }

      if (!quantity || toNumber(quantity) <= 0) {
        return 'Quantity must be greater than 0.'
      }

      return null
    }

    if (foodName.trim().length < 2) {
      return 'Food name must be at least 2 characters.'
    }

    if (!calories || toNumber(calories) < 0) {
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
      if (item.value.trim() && toNumber(item.value) < 0) {
        return `${item.label} cannot be negative.`
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
      Alert.alert('Check meal entry', validationError)
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
          quantity: toNumber(quantity),
          total_grams: entry.serving_label ? null : toNullableNumber(totalGrams),
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

      console.log('UPDATE MEAL ENTRY PAYLOAD:', payload)

      await updateMealEntry(entry.id, payload)

      blurActiveElement()

      Alert.alert('Meal updated', 'Your diary entry was updated.')

      router.push('/(tabs)/diary')
    } catch (error) {
      if (error instanceof ApiError) {
        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null
        const message = firstValidationError ?? error.message

        setFormError(message)
        Alert.alert('Could not update meal entry', message)

        return
      }

      setFormError('Could not update meal entry. Please try again.')
      Alert.alert('Could not update meal entry', 'Please try again.')
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading meal entry...</Text>
        </View>
      </Screen>
    )
  }

  if (!entry) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Meal Entry</Text>
          <Text style={styles.subtitle}>This meal entry could not be loaded.</Text>
        </View>

        {formError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to edit</Text>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : null}

        <AppButton title="Back to Diary" onPress={() => router.push('/(tabs)/diary')} />
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Meal Entry</Text>
        <Text style={styles.subtitle}>
          Update the date, meal, quantity or notes for this diary item.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Meal</Text>

        <View style={styles.chipRow}>
          {mealOptions.map((option) => {
            const selected = option.type === mealType

            return (
              <Pressable
                key={option.type}
                style={[styles.chip, selected ? styles.chipSelected : null]}
                onPress={() => setMealType(option.type)}
              >
                <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Entry details</Text>

        <View style={styles.form}>
          <AppInput
            label="Date"
            value={loggedForDate}
            onChangeText={setLoggedForDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
          />

          <AppInput
            label="Food name"
            value={foodName}
            onChangeText={setFoodName}
            placeholder="Food name"
            editable={!isFoodMode()}
          />

          <AppInput
            label="Serving label"
            value={servingLabel}
            onChangeText={setServingLabel}
            placeholder="Example: 1 plate, 1 bowl"
            editable={!isFoodMode()}
          />

          <AppInput
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="Example: 1"
            keyboardType="numeric"
          />

          {isFoodMode() && !entry.serving_label ? (
            <AppInput
              label="Total grams"
              value={totalGrams}
              onChangeText={setTotalGrams}
              placeholder="Example: 150"
              keyboardType="numeric"
            />
          ) : null}

          <AppInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional"
            multiline
          />
        </View>
      </View>

      {!isFoodMode() ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Manual nutrition</Text>

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
        </View>
      ) : (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Food database entry</Text>
          <Text style={styles.infoText}>
            Nutrition will be recalculated from the saved food and quantity. To change
            calories/macros directly, use manual quick entry.
          </Text>

          <Text style={styles.infoMetric}>
            Current calories: {formatNumber(entry.nutrition.calories)} kcal
          </Text>
        </View>
      )}

      {formError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Please check meal entry</Text>
          <Text style={styles.errorText}>{formError}</Text>
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
    gap: 8,
    marginBottom: 20
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.text
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 16,
    marginBottom: 16
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800'
  },
  chipTextSelected: {
    color: '#FFFFFF'
  },
  form: {
    gap: 14
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 12
  },
  column: {
    flex: 1
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    gap: 8
  },
  infoTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900'
  },
  infoText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  infoMetric: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900'
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    marginBottom: 16,
    gap: 4
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '800'
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20
  },
  actions: {
    gap: 12
  }
})
