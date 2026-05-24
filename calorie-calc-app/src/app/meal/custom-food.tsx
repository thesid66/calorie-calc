import { router } from 'expo-router'
import { useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { createCustomFood } from '@/api/foods'
import { AppButton, AppCard, AppInput, Chip, ErrorCard, Screen, SectionHeader } from '@/components/ui'
import { colors } from '@/constants/colors'
import type { CreateCustomFoodPayload } from '@/types/foods'

type CustomFoodType = NonNullable<CreateCustomFoodPayload['food_type']>

const foodTypeOptions: CustomFoodType[] = ['custom', 'generic', 'recipe', 'packaged', 'restaurant']

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

function normalizeBarcode(value: string) {
  return value.replace(/[^0-9]/g, '')
}

function formatFoodType(type: string) {
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
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

export default function CustomFoodScreen() {
  const submittingRef = useRef(false)

  const [name, setName] = useState('')
  const [nepaliName, setNepaliName] = useState('')
  const [brand, setBrand] = useState('')
  const [barcode, setBarcode] = useState('')
  const [foodType, setFoodType] = useState<CreateCustomFoodPayload['food_type']>('custom')
  const [cuisine, setCuisine] = useState('nepali')

  const [calories, setCalories] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [carbsG, setCarbsG] = useState('')
  const [fatG, setFatG] = useState('')
  const [fiberG, setFiberG] = useState('')
  const [sugarG, setSugarG] = useState('')
  const [sodiumMg, setSodiumMg] = useState('')

  const [servingLabel, setServingLabel] = useState('1 serving')
  const [servingGrams, setServingGrams] = useState('100')
  const [isPublic, setIsPublic] = useState(false)

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function resetForm() {
    setName('')
    setNepaliName('')
    setBrand('')
    setBarcode('')
    setFoodType('custom')
    setCuisine('nepali')

    setCalories('')
    setProteinG('')
    setCarbsG('')
    setFatG('')
    setFiberG('')
    setSugarG('')
    setSodiumMg('')

    setServingLabel('1 serving')
    setServingGrams('100')
    setIsPublic(false)
    setFormError(null)
  }

  function validateForm(): string | null {
    if (name.trim().length < 2) {
      return 'Food name must be at least 2 characters.'
    }

    if (!calories || toNumber(calories) < 0 || toNumber(calories) > 1000) {
      return 'Calories per 100g must be between 0 and 1000.'
    }

    if (!proteinG || toNumber(proteinG) < 0 || toNumber(proteinG) > 100) {
      return 'Protein per 100g must be between 0 and 100.'
    }

    if (!carbsG || toNumber(carbsG) < 0 || toNumber(carbsG) > 100) {
      return 'Carbs per 100g must be between 0 and 100.'
    }

    if (!fatG || toNumber(fatG) < 0 || toNumber(fatG) > 100) {
      return 'Fat per 100g must be between 0 and 100.'
    }

    const optionalNumbers = [
      { label: 'Fiber', value: fiberG, max: 100 },
      { label: 'Sugar', value: sugarG, max: 100 },
      { label: 'Sodium', value: sodiumMg, max: 10000 }
    ]

    for (const item of optionalNumbers) {
      if (item.value.trim()) {
        const numberValue = toNumber(item.value)

        if (numberValue < 0 || numberValue > item.max) {
          return `${item.label} value is out of allowed range.`
        }
      }
    }

    if (barcode.trim() && normalizeBarcode(barcode).length < 6) {
      return 'Barcode must contain at least 6 digits.'
    }

    if (!servingLabel.trim()) {
      return 'Serving label is required.'
    }

    if (!servingGrams || toNumber(servingGrams) < 1 || toNumber(servingGrams) > 2000) {
      return 'Serving grams must be between 1 and 2000.'
    }

    return null
  }

  async function handleCreateFood() {
    if (submittingRef.current) {
      return
    }

    setFormError(null)

    const validationError = validateForm()

    if (validationError) {
      setFormError(validationError)
      Alert.alert('Check custom food', validationError)
      return
    }

    try {
      submittingRef.current = true
      setSaving(true)

      const payload: CreateCustomFoodPayload = {
        name: name.trim(),
        nepali_name: nepaliName.trim() || null,
        brand: brand.trim() || null,
        barcode: barcode.trim() ? normalizeBarcode(barcode) : null,

        food_type: foodType,
        cuisine: cuisine.trim() || null,

        calories_per_100g: toNumber(calories),
        protein_per_100g: toNumber(proteinG),
        carbs_per_100g: toNumber(carbsG),
        fat_per_100g: toNumber(fatG),

        fiber_per_100g: toNullableNumber(fiberG),
        sugar_per_100g: toNullableNumber(sugarG),
        sodium_mg_per_100g: toNullableNumber(sodiumMg),

        is_public: isPublic,

        servings: [
          {
            label: servingLabel.trim(),
            grams: toNumber(servingGrams),
            is_default: true
          }
        ]
      }

      console.log('CUSTOM FOOD PAYLOAD:', payload)

      await createCustomFood(payload)

      blurActiveElement()

      Alert.alert('Food created', `${payload.name} was saved to your food database.`)

      resetForm()

      router.push('/(tabs)/add-food')
    } catch (error) {
      if (error instanceof ApiError) {
        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null
        const message = firstValidationError ?? error.message

        setFormError(message)
        Alert.alert('Could not create food', message)

        return
      }

      setFormError('Could not create food. Please try again.')
      Alert.alert('Could not create food', 'Please try again.')
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Create Custom Food</Text>
        <Text style={styles.subtitle}>
          Add your own food with calories and macros per 100g. You can then search and log it like
          any other food.
        </Text>
      </View>

      <AppCard gap={16} style={styles.card}>
        <SectionHeader title="Basic details" />

        <View style={styles.form}>
          <AppInput
            label="Food name"
            value={name}
            onChangeText={setName}
            placeholder="Example: Homemade chicken curry"
          />

          <AppInput
            label="Nepali name"
            value={nepaliName}
            onChangeText={setNepaliName}
            placeholder="Optional"
          />

          <AppInput label="Brand" value={brand} onChangeText={setBrand} placeholder="Optional" />

          <AppInput
            label="Barcode"
            value={barcode}
            onChangeText={(value) => setBarcode(normalizeBarcode(value))}
            placeholder="Optional"
            keyboardType="numeric"
          />

          <AppInput
            label="Cuisine"
            value={cuisine}
            onChangeText={setCuisine}
            placeholder="Example: nepali, indian, generic"
            autoCapitalize="none"
          />
        </View>
      </AppCard>

      <AppCard gap={16} style={styles.card}>
        <SectionHeader title="Food type" />

        <View style={styles.chipRow}>
          {foodTypeOptions.map((type) => {
            const selected = foodType === type

            return (
              <Chip
                key={type}
                label={formatFoodType(type)}
                selected={selected}
                onPress={() => setFoodType(type)}
              />
            )
          })}
        </View>
      </AppCard>

      <AppCard gap={16} style={styles.card}>
        <SectionHeader title="Nutrition per 100g" />

        <View style={styles.form}>
          <AppInput
            label="Calories"
            value={calories}
            onChangeText={setCalories}
            placeholder="Example: 180"
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

      <AppCard gap={16} style={styles.card}>
        <SectionHeader title="Default serving" />

        <View style={styles.form}>
          <AppInput
            label="Serving label"
            value={servingLabel}
            onChangeText={setServingLabel}
            placeholder="Example: 1 bowl, 1 plate, 1 serving"
          />

          <AppInput
            label="Serving grams"
            value={servingGrams}
            onChangeText={setServingGrams}
            placeholder="Example: 150"
            keyboardType="numeric"
          />
        </View>
      </AppCard>

      <AppCard gap={16} style={styles.card}>
        <Pressable style={styles.publicToggle} onPress={() => setIsPublic((current) => !current)}>
          <View style={[styles.checkbox, isPublic ? styles.checkboxChecked : null]}>
            {isPublic ? <Text style={styles.checkboxText}>✓</Text> : null}
          </View>

          <View style={styles.publicToggleText}>
            <Text style={styles.publicTitle}>Make public</Text>
            <Text style={styles.publicSubtitle}>
              Public custom foods may be searchable by other users later. Keep off for personal
              foods.
            </Text>
          </View>
        </Pressable>
      </AppCard>

      {formError ? (
        <View style={styles.errorSpacing}>
          <ErrorCard title="Please check custom food" message={formError} />
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppButton title="Create food" loading={saving} onPress={handleCreateFood} />

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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  publicToggle: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start'
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  checkboxText: {
    color: '#FFFFFF',
    fontWeight: '900'
  },
  publicToggleText: {
    flex: 1,
    gap: 4
  },
  publicTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900'
  },
  publicSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  errorSpacing: {
    marginBottom: 16,
  },
  actions: {
    gap: 12
  }
})
