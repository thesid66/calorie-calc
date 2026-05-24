import { router } from 'expo-router'
import { useRef, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { storeMealEntry, type StoreManualMealEntryPayload } from '@/api/mealEntries'
import { AppButton, AppCard, AppInput, Chip, ErrorCard, Screen, SectionHeader } from '@/components/ui'
import { colors } from '@/constants/colors'
import type { MealType } from '@/types/diary'

const mealOptions: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: 'Breakfast' },
  { type: 'lunch', label: 'Lunch' },
  { type: 'dinner', label: 'Dinner' },
  { type: 'snack', label: 'Snack' }
]

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
  const submittingRef = useRef(false)

  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [loggedForDate, setLoggedForDate] = useState(todayDateString())

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

  async function handleSaveManualEntry() {
    if (submittingRef.current) {
      return
    }

    setFormError(null)

    const validationError = validateForm()

    if (validationError) {
      setFormError(validationError)
      Alert.alert('Check your entry', validationError)
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

      console.log('MANUAL MEAL ENTRY PAYLOAD:', payload)

      await storeMealEntry(payload)

      blurActiveElement()

      Alert.alert('Entry logged', `${payload.manual_food_name} was added to your diary.`)

      resetForm()

      router.push('/(tabs)/diary')
    } catch (error) {
      if (error instanceof ApiError) {
        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null
        const message = firstValidationError ?? error.message

        setFormError(message)
        Alert.alert('Could not log entry', message)

        return
      }

      setFormError('Could not log entry. Please try again.')
      Alert.alert('Could not log entry', 'Please try again.')
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Manual Quick Entry</Text>
        <Text style={styles.subtitle}>
          Use this when the food is not in the database yet, or when you already know the calories
          and macros.
        </Text>
      </View>

      <AppCard gap={16} style={styles.card}>
        <View style={styles.section}>
          <SectionHeader title="Meal" />

          <View style={styles.chipRow}>
            {mealOptions.map((option) => {
              const selected = option.type === mealType

              return (
                <Chip
                  key={option.type}
                  label={option.label}
                  selected={selected}
                  onPress={() => setMealType(option.type)}
                />
              )
            })}
          </View>
        </View>

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

      <AppCard gap={16} style={styles.card}>
        <SectionHeader title="Macros" />

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

const styles = StyleSheet.create({
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
    marginBottom: 16
  },
  section: {
    gap: 12
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
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
  errorSpacing: {
    marginBottom: 16,
  },
  actions: {
    gap: 12
  }
})
