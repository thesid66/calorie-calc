import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { searchFoods } from '@/api/foods'
import { storeMealEntry } from '@/api/mealEntries'
import { AppButton } from '@/components/ui/AppButton'
import { AppInput } from '@/components/ui/AppInput'
import { Screen } from '@/components/ui/Screen'
import { colors } from '@/constants/colors'
import type { MealType } from '@/types/diary'
import type { Food, FoodServing } from '@/types/foods'

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

function getDefaultServing(food: Food): FoodServing | null {
  return food.servings.find((serving) => serving.is_default) ?? food.servings[0] ?? null
}

function estimateCalories(
  food: Food | null,
  serving: FoodServing | null,
  quantity: string,
  grams: string
) {
  if (!food) {
    return 0
  }

  const caloriesPer100g = Number(food.nutrition_per_100g.calories)

  if (serving) {
    const servingGrams = Number(serving.grams)
    const qty = toNullableNumber(quantity) ?? 1

    return (caloriesPer100g / 100) * servingGrams * qty
  }

  const totalGrams = toNullableNumber(grams) ?? 0

  return (caloriesPer100g / 100) * totalGrams
}

export default function AddFoodScreen() {
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const submittingRef = useRef(false)

  const [search, setSearch] = useState('')
  const [loadingFoods, setLoadingFoods] = useState(false)
  const [foods, setFoods] = useState<Food[]>([])

  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [selectedServingId, setSelectedServingId] = useState<number | null>(null)

  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [loggedForDate, setLoggedForDate] = useState(todayDateString())
  const [quantity, setQuantity] = useState('1')
  const [totalGrams, setTotalGrams] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const selectedServing = useMemo(() => {
    if (!selectedFood || !selectedServingId) {
      return null
    }

    return selectedFood.servings.find((serving) => serving.id === selectedServingId) ?? null
  }, [selectedFood, selectedServingId])

  const estimatedCalories = useMemo(
    () => estimateCalories(selectedFood, selectedServing, quantity, totalGrams),
    [selectedFood, selectedServing, quantity, totalGrams]
  )

  useEffect(() => {
    loadFoods('')
  }, [])

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    searchDebounceRef.current = setTimeout(() => {
      loadFoods(search)
    }, 350)

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [search])

  async function loadFoods(searchTerm: string) {
    try {
      setLoadingFoods(true)

      const response = await searchFoods({
        search: searchTerm.trim() || undefined,
        per_page: 20
      })

      setFoods(response.data.foods)
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('Could not load foods', error.message)
        return
      }

      Alert.alert('Could not load foods', 'Please check your API connection and try again.')
    } finally {
      setLoadingFoods(false)
    }
  }

  function selectFood(food: Food) {
    const defaultServing = getDefaultServing(food)

    setSelectedFood(food)
    setSelectedServingId(defaultServing?.id ?? null)
    setQuantity('1')
    setTotalGrams(defaultServing ? '' : '100')
    setFormError(null)
  }

  function clearSelectedFood() {
    setSelectedFood(null)
    setSelectedServingId(null)
    setQuantity('1')
    setTotalGrams('')
    setNotes('')
    setFormError(null)
  }

  function validateForm(): string | null {
    if (!selectedFood) {
      return 'Please select a food first.'
    }

    if (!loggedForDate.trim()) {
      return 'Date is required.'
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(loggedForDate.trim())) {
      return 'Date must be in YYYY-MM-DD format.'
    }

    if (selectedServing) {
      if (!quantity || toNumber(quantity) <= 0) {
        return 'Quantity must be greater than 0.'
      }
    }

    if (!selectedServing) {
      if (!totalGrams || toNumber(totalGrams) <= 0) {
        return 'Total grams is required when no serving is selected.'
      }
    }

    return null
  }

  async function handleLogFood() {
    if (submittingRef.current) {
      return
    }

    setFormError(null)

    const validationError = validateForm()

    if (validationError) {
      setFormError(validationError)
      Alert.alert('Check your meal entry', validationError)
      return
    }

    if (!selectedFood) {
      return
    }

    try {
      submittingRef.current = true
      setSaving(true)

      const payload = {
        entry_mode: 'food' as const,
        logged_for_date: loggedForDate.trim(),
        meal_type: mealType,
        food_id: selectedFood.id,
        food_serving_id: selectedServing ? selectedServing.id : null,
        quantity: selectedServing ? toNumber(quantity) : null,
        total_grams: selectedServing ? null : toNumber(totalGrams),
        notes: notes.trim() || null
      }

      console.log('MEAL ENTRY PAYLOAD:', payload)

      await storeMealEntry(payload)

      Alert.alert('Food logged', `${selectedFood.name} was added to your diary.`)

      clearSelectedFood()

      router.push('/(tabs)/diary')
    } catch (error) {
      if (error instanceof ApiError) {
        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null
        const message = firstValidationError ?? error.message

        setFormError(message)
        Alert.alert('Could not log food', message)

        return
      }

      setFormError('Could not log food. Please try again.')
      Alert.alert('Could not log food', 'Please try again.')
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Add Food</Text>
        <Text style={styles.subtitle}>
          Search Nepali, South Asian, custom and packaged foods, then log them to today’s diary.
        </Text>
      </View>

      <View style={styles.searchCard}>
        <AppInput
          label="Search food"
          value={search}
          onChangeText={setSearch}
          placeholder="Example: dal bhat, rice, chicken, roti"
          autoCapitalize="none"
        />

        {loadingFoods ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Searching foods...</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.quickEntryCard}>
        <View style={styles.quickEntryText}>
          <Text style={styles.quickEntryTitle}>Know the calories already?</Text>
          <Text style={styles.quickEntrySubtitle}>
            Add a quick manual entry without searching the food database.
          </Text>
        </View>

        <AppButton
          title="Manual quick entry"
          variant="secondary"
          onPress={() => router.push('/meal/manual')}
        />
      </View>

      <View style={styles.quickEntryCard}>
        <View style={styles.quickEntryText}>
          <Text style={styles.quickEntryTitle}>Have a packaged food barcode?</Text>
          <Text style={styles.quickEntrySubtitle}>
            Look up the product from Open Food Facts and save it to your food database.
          </Text>
        </View>

        <AppButton
          title="Barcode lookup"
          variant="secondary"
          onPress={() => router.push('/meal/barcode')}
        />
      </View>

      <View style={styles.quickEntryCard}>
        <View style={styles.quickEntryText}>
          <Text style={styles.quickEntryTitle}>Food not found?</Text>
          <Text style={styles.quickEntrySubtitle}>
            Create your own food with calories, macros and serving size.
          </Text>
        </View>

        <AppButton
          title="Create custom food"
          variant="secondary"
          onPress={() => router.push('/meal/custom-food')}
        />
      </View>

      {selectedFood ? (
        <View style={styles.selectedCard}>
          <View style={styles.selectedTop}>
            <View style={styles.selectedMain}>
              <Text style={styles.selectedLabel}>Selected food</Text>
              <Text style={styles.selectedName}>{selectedFood.name}</Text>

              {selectedFood.nepali_name ? (
                <Text style={styles.selectedMeta}>{selectedFood.nepali_name}</Text>
              ) : null}

              <Text style={styles.selectedMeta}>
                {formatNumber(selectedFood.nutrition_per_100g.calories)} kcal / 100g
              </Text>
            </View>

            <Pressable onPress={clearSelectedFood}>
              <Text style={styles.clearLink}>Change</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
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

          <View style={styles.form}>
            <AppInput
              label="Date"
              value={loggedForDate}
              onChangeText={setLoggedForDate}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
            />

            {selectedFood.servings.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Serving size</Text>

                <View style={styles.servingList}>
                  {selectedFood.servings.map((serving) => {
                    const selected = serving.id === selectedServingId

                    return (
                      <Pressable
                        key={serving.id}
                        style={[styles.servingCard, selected ? styles.servingSelected : null]}
                        onPress={() => {
                          setSelectedServingId(serving.id)
                          setTotalGrams('')
                        }}
                      >
                        <Text
                          style={[
                            styles.servingLabel,
                            selected ? styles.servingLabelSelected : null
                          ]}
                        >
                          {serving.label}
                        </Text>

                        <Text
                          style={[
                            styles.servingGrams,
                            selected ? styles.servingGramsSelected : null
                          ]}
                        >
                          {formatDecimal(serving.grams, 'g')}
                        </Text>
                      </Pressable>
                    )
                  })}

                  <Pressable
                    style={[
                      styles.servingCard,
                      selectedServingId === null ? styles.servingSelected : null
                    ]}
                    onPress={() => {
                      setSelectedServingId(null)
                      setTotalGrams('100')
                    }}
                  >
                    <Text
                      style={[
                        styles.servingLabel,
                        selectedServingId === null ? styles.servingLabelSelected : null
                      ]}
                    >
                      Custom grams
                    </Text>

                    <Text
                      style={[
                        styles.servingGrams,
                        selectedServingId === null ? styles.servingGramsSelected : null
                      ]}
                    >
                      Manual
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {selectedServing ? (
              <AppInput
                label="Quantity"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Example: 1"
                keyboardType="numeric"
              />
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

          <View style={styles.estimateCard}>
            <Text style={styles.estimateLabel}>Estimated calories</Text>
            <Text style={styles.estimateValue}>{formatNumber(estimatedCalories)} kcal</Text>
          </View>

          {formError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Please check your entry</Text>
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          ) : null}

          <AppButton title="Log food" loading={saving} onPress={handleLogFood} />
        </View>
      ) : (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Food results</Text>

          {foods.length === 0 && !loadingFoods ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No foods found</Text>
              <Text style={styles.emptyText}>
                Try another search term. Custom food creation will be added next.
              </Text>
            </View>
          ) : null}

          <View style={styles.foodList}>
            {foods.map((food) => (
              <Pressable key={food.id} style={styles.foodCard} onPress={() => selectFood(food)}>
                <View style={styles.foodMain}>
                  <Text style={styles.foodName}>{food.name}</Text>

                  {food.nepali_name ? (
                    <Text style={styles.foodMeta}>{food.nepali_name}</Text>
                  ) : null}

                  <Text style={styles.foodMeta}>
                    {food.cuisine ? `${food.cuisine} • ` : ''}
                    {food.source}
                    {food.is_verified ? ' • verified' : ''}
                  </Text>
                </View>

                <View style={styles.foodRight}>
                  <Text style={styles.foodCalories}>
                    {formatNumber(food.nutrition_per_100g.calories)}
                  </Text>
                  <Text style={styles.foodCaloriesLabel}>kcal/100g</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
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
  searchCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    marginBottom: 18
  },
  loadingRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14
  },
  resultsSection: {
    gap: 12
  },
  section: {
    gap: 12
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  foodList: {
    gap: 10
  },
  foodCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  foodMain: {
    flex: 1,
    gap: 4
  },
  foodName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900'
  },
  foodMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    textTransform: 'capitalize'
  },
  foodRight: {
    alignItems: 'flex-end'
  },
  foodCalories: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900'
  },
  foodCaloriesLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700'
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  selectedCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 18
  },
  selectedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  selectedMain: {
    flex: 1,
    gap: 4
  },
  selectedLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  selectedName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900'
  },
  selectedMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  clearLink: {
    color: colors.primary,
    fontSize: 14,
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
  servingList: {
    gap: 10
  },
  servingCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  servingSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  servingLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900'
  },
  servingLabelSelected: {
    color: '#FFFFFF'
  },
  servingGrams: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800'
  },
  servingGramsSelected: {
    color: '#DCFCE7'
  },
  estimateCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16
  },
  estimateLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800'
  },
  estimateValue: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
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

  quickEntryCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
    marginBottom: 18
  },
  quickEntryText: {
    gap: 4
  },
  quickEntryTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  quickEntrySubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  }
})
