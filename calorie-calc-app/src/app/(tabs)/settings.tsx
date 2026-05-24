import { useFocusEffect } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { getActivityLevels } from '@/api/activityLevels'
import { ApiError } from '@/api/client'
import { getNutritionGoal, storeNutritionGoal } from '@/api/goals'
import { getProfile, updateProfile } from '@/api/profile'
import {
  AppButton,
  AppCard,
  AppInput,
  Chip,
  ErrorCard,
  LoadingState,
  Screen,
  SectionHeader,
  AppDatePicker
} from '@/components/ui'
import { colors } from '@/constants/colors'
import type { GoalType, NutritionGoal } from '@/types/goals'
import type { ActivityLevel, SexForFormula, UnitSystem, UserProfile } from '@/types/profile'
import { useAuth } from '@/providers/AuthProvider'

const sexOptions: { value: SexForFormula; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
]

const unitOptions: { value: UnitSystem; label: string }[] = [
  { value: 'metric', label: 'Metric' },
  { value: 'imperial', label: 'Imperial' }
]

const goalOptions: { value: GoalType; label: string; description: string }[] = [
  {
    value: 'lose',
    label: 'Lose',
    description: 'Create a calorie deficit'
  },
  {
    value: 'maintain',
    label: 'Maintain',
    description: 'Keep your current weight'
  },
  {
    value: 'gain',
    label: 'Gain',
    description: 'Create a calorie surplus'
  }
]

const rateOptions = [0.25, 0.5, 0.75, 1]

function toNumber(value: string): number {
  return Number(value.replace(',', '.').trim())
}

function toNullableRate(value: GoalType, rate: number): number | null {
  if (value === 'maintain') {
    return null
  }

  return rate
}

function formatNumber(value: number | string | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return `-${suffix}`
  }

  return `${Math.round(Number(value))}${suffix}`
}

function formatDecimal(value: number | string | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return `-${suffix}`
  }

  return `${Number(value).toFixed(1)}${suffix}`
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth()

  const profileSubmittingRef = useRef(false)
  const goalSubmittingRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeGoal, setActiveGoal] = useState<NutritionGoal | null>(null)
  const [activityLevels, setActivityLevels] = useState<ActivityLevel[]>([])

  const [dateOfBirth, setDateOfBirth] = useState('')
  const [sexForFormula, setSexForFormula] = useState<SexForFormula>('male')
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric')
  const [heightCm, setHeightCm] = useState('')
  const [startingWeightKg, setStartingWeightKg] = useState('')
  const [currentWeightKg, setCurrentWeightKg] = useState('')
  const [targetWeightKg, setTargetWeightKg] = useState('')

  const [activityLevelId, setActivityLevelId] = useState<number | null>(null)
  const [goalType, setGoalType] = useState<GoalType>('maintain')
  const [targetRateKgPerWeek, setTargetRateKgPerWeek] = useState(0.5)

  const [profileSaving, setProfileSaving] = useState(false)
  const [goalSaving, setGoalSaving] = useState(false)

  const [profileError, setProfileError] = useState<string | null>(null)
  const [goalError, setGoalError] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      loadSettings()
    }, [])
  )

  async function loadSettings() {
    try {
      setRefreshing(true)

      const [profileResponse, goalResponse, activityResponse] = await Promise.all([
        getProfile(),
        getNutritionGoal(),
        getActivityLevels()
      ])

      const loadedProfile = profileResponse.data.profile
      const loadedGoal = goalResponse.data.active_goal
      const loadedActivityLevels = activityResponse.data.activity_levels

      setProfile(loadedProfile)
      setActiveGoal(loadedGoal)
      setActivityLevels(loadedActivityLevels)

      if (loadedProfile) {
        setDateOfBirth(loadedProfile.date_of_birth ?? '')
        setSexForFormula(loadedProfile.sex_for_formula ?? 'male')
        setUnitSystem(loadedProfile.unit_system ?? 'metric')
        setHeightCm(String(loadedProfile.height_cm ?? ''))
        setStartingWeightKg(String(loadedProfile.starting_weight_kg ?? ''))
        setCurrentWeightKg(String(loadedProfile.current_weight_kg ?? ''))
        setTargetWeightKg(String(loadedProfile.target_weight_kg ?? ''))
      }

      if (loadedGoal) {
        setGoalType(loadedGoal.goal_type)
        setTargetRateKgPerWeek(Number(loadedGoal.target_rate_kg_per_week ?? 0.5))
        setActivityLevelId(loadedGoal.activity_level?.id ?? null)
      } else if (loadedActivityLevels.length > 0) {
        setActivityLevelId(loadedActivityLevels[0].id)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('Could not load settings', error.message)
        return
      }

      Alert.alert('Could not load settings', 'Please check your API connection and try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function dateYearsAgo(years: number) {
    const date = new Date()
    date.setFullYear(date.getFullYear() - years)

    return date
  }

  function validateProfile(): string | null {
    if (!dateOfBirth.trim()) {
      return 'Date of birth is required.'
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())) {
      return 'Date of birth must be in YYYY-MM-DD format.'
    }

    if (!heightCm || toNumber(heightCm) < 80 || toNumber(heightCm) > 250) {
      return 'Height must be between 80 and 250 cm.'
    }

    if (!startingWeightKg || toNumber(startingWeightKg) < 20 || toNumber(startingWeightKg) > 400) {
      return 'Starting weight must be between 20 and 400 kg.'
    }

    if (!currentWeightKg || toNumber(currentWeightKg) < 20 || toNumber(currentWeightKg) > 400) {
      return 'Current weight must be between 20 and 400 kg.'
    }

    if (!targetWeightKg || toNumber(targetWeightKg) < 20 || toNumber(targetWeightKg) > 400) {
      return 'Target weight must be between 20 and 400 kg.'
    }

    if (!activityLevelId) {
      return 'Please select an activity level.'
    }

    return null
  }

  function validateGoal(): string | null {
    if (!activityLevelId) {
      return 'Please select an activity level.'
    }

    if (goalType !== 'maintain' && (!targetRateKgPerWeek || targetRateKgPerWeek < 0.1)) {
      return 'Please select a target rate.'
    }

    return null
  }

  async function handleSaveProfile() {
    if (profileSubmittingRef.current) {
      return
    }

    setProfileError(null)

    const validationError = validateProfile()

    if (validationError) {
      setProfileError(validationError)
      Alert.alert('Check profile', validationError)
      return
    }

    if (!activityLevelId) {
      return
    }

    try {
      profileSubmittingRef.current = true
      setProfileSaving(true)

      const response = await updateProfile({
        unit_system: unitSystem,
        sex_for_formula: sexForFormula,
        date_of_birth: dateOfBirth.trim(),
        height_cm: toNumber(heightCm),
        starting_weight_kg: toNumber(startingWeightKg),
        current_weight_kg: toNumber(currentWeightKg),
        target_weight_kg: toNumber(targetWeightKg),
        activity_level_id: activityLevelId
      })

      setProfile(response.data.profile)

      Alert.alert('Profile updated', 'Your profile details were saved.')
    } catch (error) {
      if (error instanceof ApiError) {
        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null
        const message = firstValidationError ?? error.message

        setProfileError(message)
        Alert.alert('Could not update profile', message)

        return
      }

      setProfileError('Could not update profile. Please try again.')
      Alert.alert('Could not update profile', 'Please try again.')
    } finally {
      profileSubmittingRef.current = false
      setProfileSaving(false)
    }
  }

  async function handleSaveGoal() {
    if (goalSubmittingRef.current) {
      return
    }

    setGoalError(null)

    const validationError = validateGoal()

    if (validationError) {
      setGoalError(validationError)
      Alert.alert('Check goal', validationError)
      return
    }

    if (!activityLevelId) {
      return
    }

    try {
      goalSubmittingRef.current = true
      setGoalSaving(true)

      const response = await storeNutritionGoal({
        activity_level_id: activityLevelId,
        goal_type: goalType,
        target_rate_kg_per_week: toNullableRate(goalType, targetRateKgPerWeek)
      })

      setActiveGoal(response.data.active_goal)

      Alert.alert('Goal updated', 'Your calorie and macro targets were recalculated.')
    } catch (error) {
      if (error instanceof ApiError) {
        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null
        const message = firstValidationError ?? error.message

        setGoalError(message)
        Alert.alert('Could not update goal', message)

        return
      }

      setGoalError('Could not update goal. Please try again.')
      Alert.alert('Could not update goal', 'Please try again.')
    } finally {
      goalSubmittingRef.current = false
      setGoalSaving(false)
    }
  }

  async function handleLogout() {
    try {
      await signOut()
    } catch {
      Alert.alert('Logout failed', 'Please try again.')
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState message="Loading settings..." />
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your profile, goal and account.</Text>
        </View>

        <Pressable style={styles.refreshButton} onPress={loadSettings}>
          <Text style={styles.refreshText}>{refreshing ? '...' : 'Refresh'}</Text>
        </Pressable>
      </View>

      <AppCard style={styles.accountCard}>
        <SectionHeader title="Account" subtitle="Current logged-in user" />

        <View style={styles.accountBox}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.name}>{user?.name ?? '-'}</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.email}>{user?.email ?? '-'}</Text>
        </View>
      </AppCard>

      <AppCard style={styles.card}>
        <SectionHeader
          title="Profile details"
          subtitle="These details are used for BMR and calorie calculations."
        />

        <View style={styles.form}>
          <AppDatePicker
            label="Date of birth"
            value={dateOfBirth}
            onChange={setDateOfBirth}
            maximumDate={dateYearsAgo(13)}
            hint="You must be at least 13 years old."
          />

          <View style={styles.optionBlock}>
            <Text style={styles.optionLabel}>Gender</Text>

            <View style={styles.chipRow}>
              {sexOptions.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={sexForFormula === option.value}
                  onPress={() => setSexForFormula(option.value)}
                />
              ))}
            </View>
          </View>

          <View style={styles.optionBlock}>
            <Text style={styles.optionLabel}>Unit system</Text>

            <View style={styles.chipRow}>
              {unitOptions.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={unitSystem === option.value}
                  onPress={() => setUnitSystem(option.value)}
                />
              ))}
            </View>
          </View>

          <AppInput
            label="Height"
            value={heightCm}
            onChangeText={setHeightCm}
            placeholder="Height in cm"
            keyboardType="numeric"
          />

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <AppInput
                label="Starting weight"
                value={startingWeightKg}
                onChangeText={setStartingWeightKg}
                placeholder="kg"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.column}>
              <AppInput
                label="Current weight"
                value={currentWeightKg}
                onChangeText={setCurrentWeightKg}
                placeholder="kg"
                keyboardType="numeric"
              />
            </View>
          </View>

          <AppInput
            label="Target weight"
            value={targetWeightKg}
            onChangeText={setTargetWeightKg}
            placeholder="Target weight in kg"
            keyboardType="numeric"
          />
        </View>

        <ErrorCard title="Please check profile" message={profileError} />

        <AppButton title="Save profile" loading={profileSaving} onPress={handleSaveProfile} />
      </AppCard>

      <AppCard style={styles.card}>
        <SectionHeader
          title="Goal settings"
          subtitle="Update your goal and recalculate daily calorie targets."
        />

        <View style={styles.optionBlock}>
          <Text style={styles.optionLabel}>Activity level</Text>

          <View style={styles.activityList}>
            {activityLevels.map((activityLevel) => {
              const selected = activityLevelId === activityLevel.id

              return (
                <Pressable
                  key={activityLevel.id}
                  style={[styles.activityCard, selected ? styles.activityCardSelected : null]}
                  onPress={() => setActivityLevelId(activityLevel.id)}
                >
                  <View style={styles.activityMain}>
                    <Text
                      style={[styles.activityName, selected ? styles.activityNameSelected : null]}
                    >
                      {activityLevel.name}
                    </Text>

                    {activityLevel.description ? (
                      <Text
                        style={[
                          styles.activityDescription,
                          selected ? styles.activityDescriptionSelected : null
                        ]}
                      >
                        {activityLevel.description}
                      </Text>
                    ) : null}
                  </View>

                  <Text
                    style={[
                      styles.activityMultiplier,
                      selected ? styles.activityMultiplierSelected : null
                    ]}
                  >
                    ×{formatDecimal(activityLevel.multiplier)}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={styles.optionBlock}>
          <Text style={styles.optionLabel}>Goal type</Text>

          <View style={styles.goalGrid}>
            {goalOptions.map((option) => {
              const selected = goalType === option.value

              return (
                <Pressable
                  key={option.value}
                  style={[styles.goalCard, selected ? styles.goalCardSelected : null]}
                  onPress={() => setGoalType(option.value)}
                >
                  <Text style={[styles.goalTitle, selected ? styles.goalTitleSelected : null]}>
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.goalDescription,
                      selected ? styles.goalDescriptionSelected : null
                    ]}
                  >
                    {option.description}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {goalType !== 'maintain' ? (
          <View style={styles.optionBlock}>
            <Text style={styles.optionLabel}>Target rate per week</Text>

            <View style={styles.chipRow}>
              {rateOptions.map((rate) => (
                <Chip
                  key={rate}
                  label={`${rate} kg/week`}
                  selected={targetRateKgPerWeek === rate}
                  onPress={() => setTargetRateKgPerWeek(rate)}
                />
              ))}
            </View>
          </View>
        ) : (
          <ErrorCard
            title="Maintain mode"
            message="Target rate is not needed when maintaining your current weight."
            variant="info"
          />
        )}

        {activeGoal ? (
          <AppCard variant="muted" style={styles.goalSummaryCard}>
            <SectionHeader title="Current target" />

            <View style={styles.targetGrid}>
              <TargetMetric
                label="Calories"
                value={formatNumber(activeGoal.daily_calorie_target, ' kcal')}
              />
              <TargetMetric
                label="Protein"
                value={formatNumber(activeGoal.protein_target_g, ' g')}
              />
              <TargetMetric label="Carbs" value={formatNumber(activeGoal.carb_target_g, ' g')} />
              <TargetMetric label="Fat" value={formatNumber(activeGoal.fat_target_g, ' g')} />
            </View>
          </AppCard>
        ) : null}

        <ErrorCard title="Please check goal" message={goalError} />

        <AppButton title="Save goal" loading={goalSaving} onPress={handleSaveGoal} />
      </AppCard>

      {!profile ? (
        <ErrorCard
          title="Profile missing"
          message="Your profile has not been created yet. Complete onboarding if profile saving fails."
          variant="warning"
        />
      ) : null}

      <View style={styles.logoutSection}>
        <AppButton title="Logout" variant="danger" onPress={handleLogout} />
      </View>
    </Screen>
  )
}

function TargetMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.targetMetric}>
      <Text style={styles.targetLabel}>{label}</Text>
      <Text style={styles.targetValue}>{value}</Text>
    </View>
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
  accountCard: {
    marginBottom: 16
  },
  card: {
    marginBottom: 16
  },
  accountBox: {
    gap: 5
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800'
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8
  },
  email: {
    color: colors.muted,
    fontSize: 15
  },
  form: {
    gap: 14
  },
  optionBlock: {
    gap: 10
  },
  optionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800'
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 12
  },
  column: {
    flex: 1
  },
  activityList: {
    gap: 10
  },
  activityCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  activityCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  activityMain: {
    flex: 1,
    gap: 3
  },
  activityName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900'
  },
  activityNameSelected: {
    color: '#FFFFFF'
  },
  activityDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  activityDescriptionSelected: {
    color: '#DCFCE7'
  },
  activityMultiplier: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900'
  },
  activityMultiplierSelected: {
    color: '#FFFFFF'
  },
  goalGrid: {
    gap: 10
  },
  goalCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 4
  },
  goalCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  goalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900'
  },
  goalTitleSelected: {
    color: '#FFFFFF'
  },
  goalDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  goalDescriptionSelected: {
    color: '#DCFCE7'
  },
  goalSummaryCard: {
    padding: 14
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  targetMetric: {
    width: '47%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    gap: 4
  },
  targetLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  targetValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900'
  },
  logoutSection: {
    marginTop: 4,
    marginBottom: 20
  }
})
