import { useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { getActivityLevels } from '@/api/activityLevels'
import { ApiError } from '@/api/client'
import { getNutritionGoal, storeNutritionGoal } from '@/api/goals'
import { getProfile, updateProfile } from '@/api/profile'
import {
  AppButton,
  AppCard,
  AppDatePicker,
  AppInput,
  Chip,
  ErrorCard,
  LoadingState,
  Screen
} from '@/components/ui'
import { colors } from '@/constants/colors'
import { macroTones, radius, shadows, spacing, typography } from '@/constants/theme'
import { useAuth } from '@/providers/AuthProvider'
import type { GoalType, NutritionGoal } from '@/types/goals'
import type { ActivityLevel, SexForFormula, UnitSystem, UserProfile } from '@/types/profile'

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

function getInitials(name: string | null | undefined) {
  if (!name) {
    return 'U'
  }

  const parts = name.trim().split(' ').filter(Boolean)

  if (parts.length === 0) {
    return 'U'
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function dateYearsAgo(years: number) {
  const date = new Date()
  date.setFullYear(date.getFullYear() - years)

  return date
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

  const accountInitials = useMemo(() => getInitials(user?.name), [user?.name])

  const selectedActivityLevel = useMemo(
    () => activityLevels.find((activityLevel) => activityLevel.id === activityLevelId) ?? null,
    [activityLevelId, activityLevels]
  )

  const selectedGoal = useMemo(
    () => goalOptions.find((option) => option.value === goalType) ?? goalOptions[1],
    [goalType]
  )

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
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Account centre</Text>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your profile, goal and account preferences.</Text>
        </View>

        <Pressable style={styles.refreshButton} onPress={loadSettings}>
          <Text style={styles.refreshText}>{refreshing ? '...' : 'Refresh'}</Text>
        </Pressable>
      </View>

      <View style={styles.accountHero}>
        <View style={styles.heroBubbleOne} />
        <View style={styles.heroBubbleTwo} />

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{accountInitials}</Text>
        </View>

        <View style={styles.accountHeroCopy}>
          <Text style={styles.accountName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.accountEmail}>{user?.email ?? '-'}</Text>

          <View style={styles.accountMetaRow}>
            <View style={styles.accountMetaPill}>
              <Text style={styles.accountMetaText}>
                {activeGoal ? activeGoal.goal_type.toUpperCase() : 'NO GOAL'}
              </Text>
            </View>

            <View style={styles.accountMetaPill}>
              <Text style={styles.accountMetaText}>{unitSystem.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryMetric
          label="Current"
          value={formatDecimal(currentWeightKg, ' kg')}
          color={colors.primary}
          softColor={colors.primarySoft}
        />

        <SummaryMetric
          label="Target"
          value={formatDecimal(targetWeightKg, ' kg')}
          color={colors.success}
          softColor={colors.successSoft}
        />

        <SummaryMetric
          label="Calories"
          value={formatNumber(activeGoal?.daily_calorie_target, ' kcal')}
          color={colors.primary}
          softColor={colors.caloriesSoft}
        />

        <SummaryMetric
          label="Activity"
          value={
            selectedActivityLevel ? `×${formatDecimal(selectedActivityLevel.multiplier)}` : '-'
          }
          color={macroTones.protein.color}
          softColor={macroTones.protein.soft}
        />
      </View>

      <AppCard gap={18} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Profile details</Text>
          <Text style={styles.cardSubtitle}>
            These details are used for BMR and calorie calculations.
          </Text>
        </View>

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

        {profileError ? <ErrorCard title="Please check profile" message={profileError} /> : null}

        <AppButton title="Save profile" loading={profileSaving} onPress={handleSaveProfile} />
      </AppCard>

      <AppCard gap={18} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Goal settings</Text>
          <Text style={styles.cardSubtitle}>
            Update your goal and recalculate daily calorie targets.
          </Text>
        </View>

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

                  <View
                    style={[styles.multiplierPill, selected ? styles.multiplierPillSelected : null]}
                  >
                    <Text
                      style={[
                        styles.activityMultiplier,
                        selected ? styles.activityMultiplierSelected : null
                      ]}
                    >
                      ×{formatDecimal(activityLevel.multiplier)}
                    </Text>
                  </View>
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

        <View style={styles.goalPreviewCard}>
          <View style={styles.goalPreviewHeader}>
            <Text style={styles.goalPreviewTitle}>{selectedGoal.label} goal</Text>
            <Text style={styles.goalPreviewText}>{selectedGoal.description}</Text>
          </View>

          {activeGoal ? (
            <View style={styles.targetGrid}>
              <TargetMetric
                label="Calories"
                value={formatNumber(activeGoal.daily_calorie_target, ' kcal')}
                color={colors.primary}
                softColor={colors.caloriesSoft}
              />
              <TargetMetric
                label="Protein"
                value={formatNumber(activeGoal.protein_target_g, ' g')}
                color={macroTones.protein.color}
                softColor={macroTones.protein.soft}
              />
              <TargetMetric
                label="Carbs"
                value={formatNumber(activeGoal.carb_target_g, ' g')}
                color={macroTones.carbs.color}
                softColor={macroTones.carbs.soft}
              />
              <TargetMetric
                label="Fat"
                value={formatNumber(activeGoal.fat_target_g, ' g')}
                color={macroTones.fat.color}
                softColor={macroTones.fat.soft}
              />
            </View>
          ) : (
            <Text style={styles.noGoalText}>Save your goal to calculate daily targets.</Text>
          )}
        </View>

        {goalError ? <ErrorCard title="Please check goal" message={goalError} /> : null}

        <AppButton title="Save goal" loading={goalSaving} onPress={handleSaveGoal} />
      </AppCard>

      {!profile ? (
        <View style={styles.warningSpacing}>
          <ErrorCard
            title="Profile missing"
            message="Your profile has not been created yet. Complete onboarding if profile saving fails."
            variant="warning"
          />
        </View>
      ) : null}

      <View style={styles.logoutSection}>
        <View style={styles.logoutCopy}>
          <Text style={styles.logoutTitle}>Account session</Text>
          <Text style={styles.logoutText}>Logout from this device when you are finished.</Text>
        </View>

        <AppButton title="Logout" variant="danger" onPress={handleLogout} />
      </View>
    </Screen>
  )
}

function SummaryMetric({
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
    <View style={styles.summaryMetric}>
      <View style={[styles.summaryIcon, { backgroundColor: softColor }]}>
        <View style={[styles.summaryDot, { backgroundColor: color }]} />
      </View>

      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  )
}

function TargetMetric({
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
    <View style={styles.targetMetric}>
      <View style={[styles.targetIcon, { backgroundColor: softColor }]}>
        <View style={[styles.targetDot, { backgroundColor: color }]} />
      </View>

      <Text style={styles.targetLabel}>{label}</Text>
      <Text style={styles.targetValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerCopy: {
    flex: 1,
    paddingRight: spacing.md
  },
  eyebrow: {
    ...typography.tiny,
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs
  },
  title: {
    ...typography.title,
    color: colors.heading
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs
  },
  refreshButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm
  },
  refreshText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900'
  },
  accountHero: {
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
  avatar: {
    width: 66,
    height: 66,
    borderRadius: radius['2xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)'
  },
  avatarText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '900'
  },
  accountHeroCopy: {
    flex: 1,
    gap: spacing.xs
  },
  accountName: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900'
  },
  accountEmail: {
    color: colors.primarySoft,
    fontSize: 14,
    fontWeight: '700'
  },
  accountMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  accountMetaPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6
  },
  accountMetaText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900'
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  summaryMetric: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    ...shadows.sm
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  summaryDot: {
    width: 11,
    height: 11,
    borderRadius: 6
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900'
  },
  summaryValue: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900'
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
  optionBlock: {
    gap: spacing.sm
  },
  optionLabel: {
    color: colors.heading,
    fontSize: 14,
    fontWeight: '900'
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  twoColumn: {
    flexDirection: 'row',
    gap: spacing.md
  },
  column: {
    flex: 1
  },
  activityList: {
    gap: spacing.sm
  },
  activityCard: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
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
    color: colors.heading,
    fontSize: 15,
    fontWeight: '900'
  },
  activityNameSelected: {
    color: colors.white
  },
  activityDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700'
  },
  activityDescriptionSelected: {
    color: colors.primarySoft
  },
  multiplierPill: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7
  },
  multiplierPillSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  activityMultiplier: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900'
  },
  activityMultiplierSelected: {
    color: colors.white
  },
  goalGrid: {
    gap: spacing.sm
  },
  goalCard: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: 4
  },
  goalCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  goalTitle: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900'
  },
  goalTitleSelected: {
    color: colors.white
  },
  goalDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700'
  },
  goalDescriptionSelected: {
    color: colors.primarySoft
  },
  goalPreviewCard: {
    backgroundColor: colors.cardWarm,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    gap: spacing.md
  },
  goalPreviewHeader: {
    gap: 3
  },
  goalPreviewTitle: {
    color: colors.heading,
    fontSize: 17,
    fontWeight: '900'
  },
  goalPreviewText: {
    color: colors.mutedDark,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700'
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  targetMetric: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: 4
  },
  targetIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  targetDot: {
    width: 11,
    height: 11,
    borderRadius: 6
  },
  targetLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900'
  },
  targetValue: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900'
  },
  noGoalText: {
    color: colors.mutedDark,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700'
  },
  warningSpacing: {
    marginBottom: spacing.lg
  },
  logoutSection: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
    ...shadows.sm
  },
  logoutCopy: {
    gap: 3
  },
  logoutTitle: {
    color: colors.heading,
    fontSize: 17,
    fontWeight: '900'
  },
  logoutText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700'
  }
})
