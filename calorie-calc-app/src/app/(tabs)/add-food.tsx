import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { addFoodFavorite, getFoodFavorites, removeFoodFavorite } from '@/api/foodFavorites'
import { searchFoods } from '@/api/foods'
import { getRecentMealEntries, storeMealEntry } from '@/api/mealEntries'
import { AppButton, AppDatePicker, AppInput, Chip, ErrorCard, Screen } from '@/components/ui'
import { colors } from '@/constants/colors'
import { mealTones, radius, shadows, spacing, typography } from '@/constants/theme'
import type { MealEntry, MealType } from '@/types/diary'
import type { Food, FoodServing } from '@/types/foods'

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

function readableDate(dateString: string) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  }).format(new Date(`${dateString}T00:00:00`))
}

export default function AddFoodScreen() {
  const params = useLocalSearchParams<{
    date?: string | string[]
    mealType?: string | string[]
  }>()

  const paramDate = getSingleParam(params.date)
  const paramMealType = getSingleParam(params.mealType)

  const initialLoggedForDate = isDateParam(paramDate) ? paramDate : todayDateString()
  const initialMealType: MealType = isMealTypeParam(paramMealType) ? paramMealType : 'breakfast'

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const submittingRef = useRef(false)

  const [search, setSearch] = useState('')
  const [loadingFoods, setLoadingFoods] = useState(false)
  const [foods, setFoods] = useState<Food[]>([])

  const [recentEntries, setRecentEntries] = useState<MealEntry[]>([])
  const [loadingRecentEntries, setLoadingRecentEntries] = useState(false)
  const [quickLoggingEntryId, setQuickLoggingEntryId] = useState<number | null>(null)

  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [selectedServingId, setSelectedServingId] = useState<number | null>(null)

  const [mealType, setMealType] = useState<MealType>(initialMealType)
  const [loggedForDate, setLoggedForDate] = useState(initialLoggedForDate)
  const [quantity, setQuantity] = useState('1')
  const [totalGrams, setTotalGrams] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [favoriteFoods, setFavoriteFoods] = useState<Food[]>([])
  const [favoriteFoodIds, setFavoriteFoodIds] = useState<number[]>([])
  const [loadingFavoriteFoods, setLoadingFavoriteFoods] = useState(false)
  const [updatingFavoriteFoodId, setUpdatingFavoriteFoodId] = useState<number | null>(null)

  const selectedMealTone = mealTones[mealType]
  const isSearching = search.trim().length > 0

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

  const loadRecentEntries = useCallback(async () => {
    try {
      setLoadingRecentEntries(true)

      const response = await getRecentMealEntries(10)

      setRecentEntries(response.data.meal_entries)
    } catch (error) {
      if (error instanceof ApiError) {
        console.log('Could not load recent entries:', error.message)
        return
      }

      console.log('Could not load recent entries.')
    } finally {
      setLoadingRecentEntries(false)
    }
  }, [])

  const loadFavoriteFoods = useCallback(async () => {
    try {
      setLoadingFavoriteFoods(true)

      const response = await getFoodFavorites()

      setFavoriteFoods(response.data.foods)
      setFavoriteFoodIds(response.data.food_ids)
    } catch (error) {
      if (error instanceof ApiError) {
        console.log('Could not load favourite foods:', error.message)
        return
      }

      console.log('Could not load favourite foods.')
    } finally {
      setLoadingFavoriteFoods(false)
    }
  }, [])

  useEffect(() => {
    loadFoods('')
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadRecentEntries()
      loadFavoriteFoods()
    }, [loadRecentEntries, loadFavoriteFoods])
  )

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

  useEffect(() => {
    if (isDateParam(paramDate)) {
      setLoggedForDate(paramDate)
    }

    if (isMealTypeParam(paramMealType)) {
      setMealType(paramMealType)
    }
  }, [paramDate, paramMealType])

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

  async function toggleFavoriteFood(food: Food) {
    if (updatingFavoriteFoodId === food.id) {
      return
    }

    const isFavorite = favoriteFoodIds.includes(food.id)

    try {
      setUpdatingFavoriteFoodId(food.id)

      if (isFavorite) {
        await removeFoodFavorite(food.id)

        setFavoriteFoodIds((current) => current.filter((foodId) => foodId !== food.id))
        setFavoriteFoods((current) => current.filter((favoriteFood) => favoriteFood.id !== food.id))
      } else {
        const response = await addFoodFavorite(food.id)

        setFavoriteFoodIds((current) =>
          current.includes(food.id) ? current : [food.id, ...current]
        )

        setFavoriteFoods((current) => {
          if (current.some((favoriteFood) => favoriteFood.id === food.id)) {
            return current
          }

          return [response.data.food, ...current]
        })
      }
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('Could not update favourite', error.message)
        return
      }

      Alert.alert('Could not update favourite', 'Please try again.')
    } finally {
      setUpdatingFavoriteFoodId(null)
    }
  }

  async function handleQuickRelog(entry: MealEntry) {
    if (submittingRef.current) {
      return
    }

    setFormError(null)

    try {
      submittingRef.current = true
      setQuickLoggingEntryId(entry.id)

      if (entry.food_id) {
        const calculatedTotalGrams =
          entry.total_grams ??
          (entry.serving_grams !== null && entry.serving_grams !== undefined
            ? Number(entry.serving_grams) * Number(entry.quantity ?? 1)
            : null)

        if (calculatedTotalGrams && calculatedTotalGrams > 0) {
          await storeMealEntry({
            entry_mode: 'food',
            logged_for_date: loggedForDate.trim(),
            meal_type: mealType,
            food_id: entry.food_id,
            food_serving_id: null,
            quantity: null,
            total_grams: calculatedTotalGrams,
            notes: entry.notes
          })
        } else {
          await storeMealEntry({
            entry_mode: 'manual',
            logged_for_date: loggedForDate.trim(),
            meal_type: mealType,
            manual_food_name: entry.food_name,
            serving_label: entry.serving_label,
            calories: entry.nutrition.calories,
            protein_g: entry.nutrition.protein_g,
            carbs_g: entry.nutrition.carbs_g,
            fat_g: entry.nutrition.fat_g,
            fiber_g: entry.nutrition.fiber_g,
            sugar_g: entry.nutrition.sugar_g,
            sodium_mg: entry.nutrition.sodium_mg,
            notes: entry.notes
          })
        }
      } else {
        await storeMealEntry({
          entry_mode: 'manual',
          logged_for_date: loggedForDate.trim(),
          meal_type: mealType,
          manual_food_name: entry.food_name,
          serving_label: entry.serving_label,
          calories: entry.nutrition.calories,
          protein_g: entry.nutrition.protein_g,
          carbs_g: entry.nutrition.carbs_g,
          fat_g: entry.nutrition.fat_g,
          fiber_g: entry.nutrition.fiber_g,
          sugar_g: entry.nutrition.sugar_g,
          sodium_mg: entry.nutrition.sodium_mg,
          notes: entry.notes
        })
      }

      Alert.alert('Food logged', `${entry.food_name} was added to your diary.`)

      router.push('/(tabs)/diary')
    } catch (error) {
      if (error instanceof ApiError) {
        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null
        const message = firstValidationError ?? error.message

        setFormError(message)
        Alert.alert('Could not log recent food', message)

        return
      }

      setFormError('Could not log recent food. Please try again.')
      Alert.alert('Could not log recent food', 'Please try again.')
    } finally {
      submittingRef.current = false
      setQuickLoggingEntryId(null)
    }
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

      await storeMealEntry({
        entry_mode: 'food',
        logged_for_date: loggedForDate.trim(),
        meal_type: mealType,
        food_id: selectedFood.id,
        food_serving_id: selectedServing ? selectedServing.id : null,
        quantity: selectedServing ? toNumber(quantity) : null,
        total_grams: selectedServing ? null : toNumber(totalGrams),
        notes: notes.trim() || null
      })

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
        <Text style={styles.eyebrow}>Food logger</Text>
        <Text style={styles.title}>Add food</Text>
        <Text style={styles.subtitle}>
          Search, scan, create or quickly re-log foods to your diary.
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

      <View style={styles.searchHero}>
        <View style={styles.searchHeroTop}>
          <View>
            <Text style={styles.searchTitle}>Find your food</Text>
            <Text style={styles.searchSubtitle}>Try dal bhat, rice, roti, chicken or milk.</Text>
          </View>

          {loadingFoods ? <ActivityIndicator color={colors.primary} /> : null}
        </View>

        <AppInput
          label="Search food"
          value={search}
          onChangeText={setSearch}
          placeholder="Example: dal bhat, rice, chicken, roti"
          autoCapitalize="none"
        />
      </View>

      {isSearching && !selectedFood ? (
        <FoodShelf
          title="Search results"
          subtitle={loadingFoods ? 'Searching...' : `${foods.length} result(s) found`}
        >
          {loadingFoods ? (
            <Text style={styles.loadingText}>Searching foods...</Text>
          ) : foods.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No foods found</Text>
              <Text style={styles.emptyText}>
                Try another search term, add it manually, or create a custom food.
              </Text>
            </View>
          ) : (
            foods.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                favorite={favoriteFoodIds.includes(food.id)}
                updatingFavorite={updatingFavoriteFoodId === food.id}
                onSelect={() => selectFood(food)}
                onToggleFavorite={(event) => {
                  event.stopPropagation()
                  toggleFavoriteFood(food)
                }}
              />
            ))
          )}
        </FoodShelf>
      ) : null}

      {!isSearching && !selectedFood ? (
        <View style={styles.quickGrid}>
          <CommandCard
            icon="✎"
            title="Manual"
            subtitle="Quick calories"
            onPress={() =>
              router.push({
                pathname: '/meal/manual',
                params: {
                  date: loggedForDate,
                  mealType
                }
              })
            }
          />

          <CommandCard
            icon="▦"
            title="Barcode"
            subtitle="Packaged food"
            onPress={() => router.push('/meal/barcode')}
          />

          <CommandCard
            icon="+"
            title="Custom"
            subtitle="Create food"
            onPress={() => router.push('/meal/custom-food')}
          />
        </View>
      ) : null}

      {selectedFood ? (
        <View style={styles.selectedCard}>
          <View style={styles.selectedHeader}>
            <View style={styles.selectedHeaderLeft}>
              <View style={styles.selectedIcon}>
                <Text style={styles.selectedIconText}>🍽️</Text>
              </View>

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
            </View>

            <Pressable style={styles.changeButton} onPress={clearSelectedFood}>
              <Text style={styles.changeButtonText}>Change</Text>
            </Pressable>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Meal</Text>

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
          </View>

          <View style={styles.form}>
            <AppDatePicker label="Date" value={loggedForDate} onChange={setLoggedForDate} />

            {selectedFood.servings.length > 0 ? (
              <View style={styles.formSection}>
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
                        <View>
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
                              styles.servingHint,
                              selected ? styles.servingHintSelected : null
                            ]}
                          >
                            Standard serving
                          </Text>
                        </View>

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
                    <View>
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
                          styles.servingHint,
                          selectedServingId === null ? styles.servingHintSelected : null
                        ]}
                      >
                        Enter exact weight
                      </Text>
                    </View>

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
            <View>
              <Text style={styles.estimateLabel}>Estimated calories</Text>
              <Text style={styles.estimateHint}>Based on selected serving and quantity.</Text>
            </View>

            <Text style={styles.estimateValue}>{formatNumber(estimatedCalories)} kcal</Text>
          </View>

          <ErrorCard title="Please check your entry" message={formError} />

          <AppButton title="Log food" loading={saving} onPress={handleLogFood} />
        </View>
      ) : !isSearching ? (
        <>
          {favoriteFoods.length > 0 || loadingFavoriteFoods ? (
            <FoodShelf title="Favourite foods" subtitle="Pinned foods you use often.">
              {loadingFavoriteFoods ? (
                <Text style={styles.loadingText}>Loading favourite foods...</Text>
              ) : (
                favoriteFoods.map((food) => (
                  <FoodCard
                    key={food.id}
                    food={food}
                    favorite={favoriteFoodIds.includes(food.id)}
                    updatingFavorite={updatingFavoriteFoodId === food.id}
                    onSelect={() => selectFood(food)}
                    onToggleFavorite={(event) => {
                      event.stopPropagation()
                      toggleFavoriteFood(food)
                    }}
                  />
                ))
              )}
            </FoodShelf>
          ) : null}

          {recentEntries.length > 0 || loadingRecentEntries ? (
            <FoodShelf title="Recent foods" subtitle="Quickly log foods you added recently.">
              {loadingRecentEntries ? (
                <Text style={styles.loadingText}>Loading recent foods...</Text>
              ) : (
                recentEntries.map((entry) => (
                  <RecentEntryCard
                    key={entry.id}
                    entry={entry}
                    logging={quickLoggingEntryId === entry.id}
                    onPress={() => handleQuickRelog(entry)}
                  />
                ))
              )}
            </FoodShelf>
          ) : null}

          <FoodShelf title="Food results" subtitle={`${foods.length} result(s) found`}>
            {foods.length === 0 && !loadingFoods ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No foods found</Text>
                <Text style={styles.emptyText}>
                  Try another search term or create a custom food.
                </Text>
              </View>
            ) : null}

            {foods.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                favorite={favoriteFoodIds.includes(food.id)}
                updatingFavorite={updatingFavoriteFoodId === food.id}
                onSelect={() => selectFood(food)}
                onToggleFavorite={(event) => {
                  event.stopPropagation()
                  toggleFavoriteFood(food)
                }}
              />
            ))}
          </FoodShelf>
        </>
      ) : null}
    </Screen>
  )
}

function CommandCard({
  icon,
  title,
  subtitle,
  onPress
}: {
  icon: string
  title: string
  subtitle: string
  onPress: () => void
}) {
  return (
    <Pressable style={styles.commandCard} onPress={onPress}>
      <View style={styles.commandIcon}>
        <Text style={styles.commandIconText}>{icon}</Text>
      </View>

      <Text style={styles.commandTitle}>{title}</Text>
      <Text style={styles.commandSubtitle}>{subtitle}</Text>
    </Pressable>
  )
}

function FoodShelf({
  title,
  subtitle,
  children
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <View style={styles.shelf}>
      <View style={styles.shelfHeader}>
        <Text style={styles.shelfTitle}>{title}</Text>
        <Text style={styles.shelfSubtitle}>{subtitle}</Text>
      </View>

      <View style={styles.foodList}>{children}</View>
    </View>
  )
}

function FoodCard({
  food,
  favorite,
  updatingFavorite,
  onSelect,
  onToggleFavorite
}: {
  food: Food
  favorite: boolean
  updatingFavorite: boolean
  onSelect: () => void
  onToggleFavorite: (event: { stopPropagation: () => void }) => void
}) {
  return (
    <Pressable style={styles.foodCard} onPress={onSelect}>
      <View style={styles.foodMain}>
        <Text style={styles.foodName}>{food.name}</Text>

        {food.nepali_name ? <Text style={styles.foodNepaliName}>{food.nepali_name}</Text> : null}

        <View style={styles.foodMetaRow}>
          {food.cuisine ? <Text style={styles.foodTag}>{food.cuisine}</Text> : null}
          <Text style={styles.foodTag}>{food.source}</Text>
          {food.is_verified ? <Text style={styles.verifiedTag}>Verified</Text> : null}
        </View>
      </View>

      <View style={styles.foodRight}>
        <Pressable
          style={styles.favoriteButton}
          disabled={updatingFavorite}
          onPress={onToggleFavorite}
        >
          <Text style={styles.favoriteButtonText}>{favorite ? '★' : '☆'}</Text>
        </Pressable>

        <Text style={styles.foodCalories}>{formatNumber(food.nutrition_per_100g.calories)}</Text>
        <Text style={styles.foodCaloriesLabel}>kcal/100g</Text>
      </View>
    </Pressable>
  )
}

function RecentEntryCard({
  entry,
  logging,
  onPress
}: {
  entry: MealEntry
  logging: boolean
  onPress: () => void
}) {
  return (
    <View style={styles.recentCard}>
      <View style={styles.recentMain}>
        <Text style={styles.recentName}>{entry.food_name}</Text>

        <Text style={styles.recentMeta}>
          {entry.serving_label ? `${entry.quantity} × ${entry.serving_label}` : 'Recent entry'}
          {entry.total_grams ? ` • ${formatDecimal(entry.total_grams, 'g')}` : ''}
        </Text>

        <Text style={styles.recentCalories}>{formatNumber(entry.nutrition.calories)} kcal</Text>
      </View>

      <Pressable style={styles.logAgainButton} disabled={logging} onPress={onPress}>
        <Text style={styles.logAgainText}>{logging ? 'Logging...' : 'Log'}</Text>
      </Pressable>
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
    marginBottom: spacing.md,
    ...shadows.sm
  },
  contextIcon: {
    width: 48,
    height: 48,
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
  searchHero: {
    backgroundColor: colors.cardWarm,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md
  },
  searchHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'flex-start'
  },
  searchTitle: {
    color: colors.heading,
    fontSize: 21,
    fontWeight: '900'
  },
  searchSubtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 3
  },
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing['2xl']
  },
  commandCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.sm
  },
  commandIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  commandIconText: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '900'
  },
  commandTitle: {
    color: colors.heading,
    fontSize: 15,
    fontWeight: '900'
  },
  commandSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17
  },
  shelf: {
    marginBottom: spacing['2xl'],
    gap: spacing.md
  },
  shelfHeader: {
    gap: 2
  },
  shelfTitle: {
    ...typography.heading,
    color: colors.heading
  },
  shelfSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  },
  foodList: {
    gap: spacing.md
  },
  foodCard: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    ...shadows.sm
  },
  foodMain: {
    flex: 1,
    gap: spacing.xs
  },
  foodName: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900'
  },
  foodNepaliName: {
    color: colors.mutedDark,
    fontSize: 13,
    fontWeight: '800'
  },
  foodMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs
  },
  foodTag: {
    color: colors.muted,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'capitalize'
  },
  verifiedTag: {
    color: colors.success,
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '900'
  },
  foodRight: {
    alignItems: 'flex-end',
    gap: 4
  },
  favoriteButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  favoriteButtonText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900'
  },
  foodCalories: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '900'
  },
  foodCaloriesLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  recentCard: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'center',
    ...shadows.sm
  },
  recentMain: {
    flex: 1,
    gap: 4
  },
  recentName: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900'
  },
  recentMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  },
  recentCalories: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900'
  },
  logAgainButton: {
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  logAgainText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900'
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700'
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs
  },
  emptyTitle: {
    color: colors.heading,
    fontSize: 17,
    fontWeight: '900'
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700'
  },
  selectedCard: {
    backgroundColor: colors.card,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
    marginBottom: spacing['2xl'],
    ...shadows.md
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'flex-start'
  },
  selectedHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md
  },
  selectedIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedIconText: {
    fontSize: 23
  },
  selectedMain: {
    flex: 1,
    gap: 3
  },
  selectedLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  selectedName: {
    color: colors.heading,
    fontSize: 20,
    fontWeight: '900'
  },
  selectedMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700'
  },
  changeButton: {
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  changeButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900'
  },
  formSection: {
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.heading,
    fontSize: 17,
    fontWeight: '900'
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  form: {
    gap: spacing.md
  },
  servingList: {
    gap: spacing.sm
  },
  servingCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'center'
  },
  servingSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  servingLabel: {
    color: colors.heading,
    fontSize: 15,
    fontWeight: '900'
  },
  servingLabelSelected: {
    color: colors.white
  },
  servingHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  },
  servingHintSelected: {
    color: colors.primarySoft
  },
  servingGrams: {
    color: colors.mutedDark,
    fontSize: 13,
    fontWeight: '900'
  },
  servingGramsSelected: {
    color: colors.white
  },
  estimateCard: {
    borderRadius: radius['2xl'],
    backgroundColor: colors.caloriesSoft,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md
  },
  estimateLabel: {
    color: colors.heading,
    fontSize: 15,
    fontWeight: '900'
  },
  estimateHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  },
  estimateValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900'
  }
})
