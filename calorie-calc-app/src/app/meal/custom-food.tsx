import { router } from 'expo-router'
import { useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { createCustomFood } from '@/api/foods'
import {
  AppButton,
  AppCard,
  AppInput,
  appToast,
  Chip,
  ErrorCard,
  Screen
} from '../../components/ui'
import { colors } from '@/constants/colors'
import { macroTones, radius, shadows, spacing, typography } from '@/constants/theme'
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

function isInvalidRequiredNumber(value: string, min: number, max: number) {
  if (!value.trim()) {
    return true
  }

  const numericValue = toNumber(value)

  return Number.isNaN(numericValue) || numericValue < min || numericValue > max
}

function isInvalidOptionalNumber(value: string, min: number, max: number) {
  if (!value.trim()) {
    return false
  }

  const numericValue = toNumber(value)

  return Number.isNaN(numericValue) || numericValue < min || numericValue > max
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

export default function CustomFoodScreen() {
  const submittingRef = useRef(false)

  const [name, setName] = useState('')
  const [nepaliName, setNepaliName] = useState('')
  const [brand, setBrand] = useState('')
  const [barcode, setBarcode] = useState('')
  const [foodType, setFoodType] = useState<CustomFoodType>('custom')
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

  const preview = useMemo(
    () => ({
      calories: toNullableNumber(calories),
      protein: toNullableNumber(proteinG),
      carbs: toNullableNumber(carbsG),
      fat: toNullableNumber(fatG),
      servingGrams: toNullableNumber(servingGrams)
    }),
    [calories, proteinG, carbsG, fatG, servingGrams]
  )

  const servingCalories = useMemo(() => {
    if (!preview.calories || !preview.servingGrams) {
      return 0
    }

    return (preview.calories / 100) * preview.servingGrams
  }, [preview.calories, preview.servingGrams])

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

    if (isInvalidRequiredNumber(calories, 0, 1000)) {
      return 'Calories per 100g must be between 0 and 1000.'
    }

    if (isInvalidRequiredNumber(proteinG, 0, 100)) {
      return 'Protein per 100g must be between 0 and 100.'
    }

    if (isInvalidRequiredNumber(carbsG, 0, 100)) {
      return 'Carbs per 100g must be between 0 and 100.'
    }

    if (isInvalidRequiredNumber(fatG, 0, 100)) {
      return 'Fat per 100g must be between 0 and 100.'
    }

    const optionalNumbers = [
      { label: 'Fiber', value: fiberG, max: 100 },
      { label: 'Sugar', value: sugarG, max: 100 },
      { label: 'Sodium', value: sodiumMg, max: 10000 }
    ]

    for (const item of optionalNumbers) {
      if (isInvalidOptionalNumber(item.value, 0, item.max)) {
        return `${item.label} value is out of allowed range.`
      }
    }

    if (barcode.trim() && normalizeBarcode(barcode).length < 6) {
      return 'Barcode must contain at least 6 digits.'
    }

    if (!servingLabel.trim()) {
      return 'Serving label is required.'
    }

    if (isInvalidRequiredNumber(servingGrams, 1, 2000)) {
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
      appToast.warning({ title: 'Check custom food', message: validationError })
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

      await createCustomFood(payload)

      blurActiveElement()

      appToast.success({
        title: 'Food created',
        message: `${payload.name} was saved to your food database.`
      })

      resetForm()

      router.push('/(tabs)/add-food')
    } catch (error) {
      if (error instanceof ApiError) {
        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null
        const message = firstValidationError ?? error.message

        setFormError(message)
        appToast.error({ title: 'Could not create food', message })

        return
      }

      setFormError('Could not create food. Please try again.')
      appToast.error({ title: 'Could not create food', message: 'Please try again.' })
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Food database</Text>
        <Text style={styles.title}>Create custom food</Text>
        <Text style={styles.subtitle}>
          Add your own reusable food with nutrition per 100g and a default serving size.
        </Text>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroBubbleOne} />
        <View style={styles.heroBubbleTwo} />

        <View style={styles.heroIcon}>
          <Text style={styles.heroIconText}>＋</Text>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Build your own food</Text>
          <Text style={styles.heroText}>
            Once saved, this food will appear in search and can be logged like any database food.
          </Text>
        </View>
      </View>

      <AppCard gap={18} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Basic details</Text>
          <Text style={styles.cardSubtitle}>Name, cuisine, brand and optional barcode.</Text>
        </View>

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

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <AppInput
                label="Brand"
                value={brand}
                onChangeText={setBrand}
                placeholder="Optional"
              />
            </View>

            <View style={styles.column}>
              <AppInput
                label="Cuisine"
                value={cuisine}
                onChangeText={setCuisine}
                placeholder="nepali"
                autoCapitalize="none"
              />
            </View>
          </View>

          <AppInput
            label="Barcode"
            value={barcode}
            onChangeText={(value) => setBarcode(normalizeBarcode(value))}
            placeholder="Optional"
            keyboardType="numeric"
          />
        </View>
      </AppCard>

      <AppCard gap={18} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Food type</Text>
          <Text style={styles.cardSubtitle}>Choose the closest category for this food.</Text>
        </View>

        <View style={styles.chipRow}>
          {foodTypeOptions.map((type) => (
            <Chip
              key={type}
              label={formatFoodType(type)}
              selected={foodType === type}
              onPress={() => setFoodType(type)}
            />
          ))}
        </View>
      </AppCard>

      <AppCard gap={18} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Nutrition per 100g</Text>
          <Text style={styles.cardSubtitle}>
            These values are used to calculate calories for any serving size.
          </Text>
        </View>

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

      <AppCard gap={18} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Default serving</Text>
          <Text style={styles.cardSubtitle}>
            This serving will be selected by default when logging this food.
          </Text>
        </View>

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

      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>Food preview</Text>
          <Text style={styles.previewSubtitle}>Estimated values based on your current inputs.</Text>
        </View>

        <View style={styles.previewGrid}>
          <PreviewMetric
            label="Calories / 100g"
            value={formatNumber(preview.calories, ' kcal')}
            color={colors.primary}
            softColor={colors.caloriesSoft}
          />

          <PreviewMetric
            label="Serving calories"
            value={formatNumber(servingCalories, ' kcal')}
            color={colors.primary}
            softColor={colors.primarySoft}
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

          <PreviewMetric
            label="Serving size"
            value={formatDecimal(preview.servingGrams, 'g')}
            color={colors.success}
            softColor={colors.successSoft}
          />
        </View>
      </View>

      <Pressable
        style={[styles.publicCard, isPublic ? styles.publicCardActive : null]}
        onPress={() => setIsPublic((current) => !current)}
      >
        <View style={[styles.checkbox, isPublic ? styles.checkboxChecked : null]}>
          {isPublic ? <Text style={styles.checkboxText}>✓</Text> : null}
        </View>

        <View style={styles.publicToggleText}>
          <Text style={styles.publicTitle}>Make public</Text>
          <Text style={styles.publicSubtitle}>
            Keep this off for personal foods. Turn it on only if this food should be reusable by
            others later.
          </Text>
        </View>
      </Pressable>

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
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius['3xl'],
    padding: spacing['2xl'],
    marginBottom: spacing.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
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
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: radius['2xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroIconText: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '900'
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs
  },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900'
  },
  heroText: {
    color: colors.primarySoft,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700'
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
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
  publicCard: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    ...shadows.sm
  },
  publicCardActive: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  checkboxText: {
    color: colors.white,
    fontWeight: '900'
  },
  publicToggleText: {
    flex: 1,
    gap: spacing.xs
  },
  publicTitle: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900'
  },
  publicSubtitle: {
    color: colors.mutedDark,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700'
  },
  errorSpacing: {
    marginBottom: spacing.lg
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.xl
  }
})
