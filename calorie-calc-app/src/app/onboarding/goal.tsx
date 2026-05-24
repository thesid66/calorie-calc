import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { getActivityLevels } from '@/api/activityLevels'
import { ApiError } from '@/api/client'
import { getNutritionGoal, storeNutritionGoal } from '@/api/goals'
import { getProfile } from '@/api/profile'
import { AppButton, AppInput, ErrorCard, LoadingState, Screen } from '@/components/ui'
import { colors } from '@/constants/colors'
import type { GoalType } from '@/types/goals'
import type { ActivityLevel, UserProfile } from '@/types/profile'

type GoalOption = {
  type: GoalType
  title: string
  description: string
}

const goalOptions: GoalOption[] = [
  {
    type: 'lose',
    title: 'Lose weight',
    description: 'Create a calorie deficit based on your profile and selected weekly rate.'
  },
  {
    type: 'maintain',
    title: 'Maintain weight',
    description: 'Keep your calories close to your daily energy needs.'
  },
  {
    type: 'gain',
    title: 'Gain weight',
    description: 'Create a calorie surplus to support gradual weight gain.'
  }
]

const rateOptions = ['0.25', '0.5', '0.75', '1']

export default function OnboardingGoalScreen() {
  const submittingRef = useRef(false)

  const [loadingInitialData, setLoadingInitialData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activityLevels, setActivityLevels] = useState<ActivityLevel[]>([])
  const [activityLevelId, setActivityLevelId] = useState<number | null>(null)

  const [goalType, setGoalType] = useState<GoalType>('lose')
  const [targetRateKgPerWeek, setTargetRateKgPerWeek] = useState('0.5')

  const selectedGoal = useMemo(
    () => goalOptions.find((option) => option.type === goalType),
    [goalType]
  )

  const selectedActivityLevel = useMemo(
    () => activityLevels.find((level) => level.id === activityLevelId),
    [activityLevels, activityLevelId]
  )

  async function loadInitialData() {
    try {
      setLoadingInitialData(true)

      const [profileResponse, activityResponse, goalResponse] = await Promise.all([
        getProfile(),
        getActivityLevels(),
        getNutritionGoal()
      ])

      const loadedProfile = profileResponse.data.profile
      const loadedActivityLevels = activityResponse.data.activity_levels
      const existingGoal = goalResponse.data.active_goal

      setProfile(loadedProfile)
      setActivityLevels(loadedActivityLevels)

      const firstActivityLevelId =
        loadedActivityLevels.length > 0 ? loadedActivityLevels[0].id : null

      if (existingGoal) {
        setGoalType(existingGoal.goal_type)
        setTargetRateKgPerWeek(
          existingGoal.target_rate_kg_per_week
            ? String(existingGoal.target_rate_kg_per_week)
            : '0.5'
        )

        setActivityLevelId(existingGoal.activity_level?.id ?? firstActivityLevelId)
        return
      }

      setActivityLevelId(firstActivityLevelId)

      if (
        loadedProfile?.current_weight_kg &&
        loadedProfile?.target_weight_kg &&
        loadedProfile.target_weight_kg < loadedProfile.current_weight_kg
      ) {
        setGoalType('lose')
      }

      if (
        loadedProfile?.current_weight_kg &&
        loadedProfile?.target_weight_kg &&
        loadedProfile.target_weight_kg > loadedProfile.current_weight_kg
      ) {
        setGoalType('gain')
      }

      if (
        loadedProfile?.current_weight_kg &&
        loadedProfile?.target_weight_kg &&
        loadedProfile.target_weight_kg === loadedProfile.current_weight_kg
      ) {
        setGoalType('maintain')
      }
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('Could not load goal setup', error.message)
        return
      }

      Alert.alert('Could not load goal setup', 'Please check your API connection and try again.')
    } finally {
      setLoadingInitialData(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  function blurActiveElement() {
    if (typeof document === 'undefined') {
      return
    }

    const activeElement = document.activeElement as HTMLElement | null

    if (activeElement?.blur) {
      activeElement.blur()
    }
  }

  function validateForm(): string | null {
    if (!profile) {
      return 'Please complete your profile setup first.'
    }

    if (!activityLevelId) {
      return 'Please select your activity level.'
    }

    if (goalType !== 'maintain') {
      const rate = Number(targetRateKgPerWeek.replace(',', '.').trim())

      if (!rate || rate < 0.1 || rate > 1) {
        return 'Target rate must be between 0.10 and 1.00 kg per week.'
      }
    }

    return null
  }

  async function handleSaveGoal() {
    if (submittingRef.current) {
      return
    }

    setFormError(null)

    const validationError = validateForm()

    if (validationError) {
      setFormError(validationError)
      Alert.alert('Check your goal', validationError)
      return
    }

    try {
      submittingRef.current = true
      setSaving(true)

      const payload = {
        activity_level_id: Number(activityLevelId),
        goal_type: goalType,
        target_rate_kg_per_week:
          goalType === 'maintain' ? null : Number(targetRateKgPerWeek.replace(',', '.').trim())
      }

      console.log('GOAL PAYLOAD:', payload)

      await storeNutritionGoal(payload)

      blurActiveElement()

      router.push('/onboarding/summary')
    } catch (error) {
      if (error instanceof ApiError) {
        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null
        const message = firstValidationError ?? error.message

        setFormError(message)
        Alert.alert('Could not save goal', message)

        return
      }

      setFormError('Could not save goal. Please try again.')
      Alert.alert('Could not save goal', 'Please try again.')
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  if (loadingInitialData) {
    return (
      <Screen scroll={false}>
        <LoadingState message="Loading goal setup..." />
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Goal setup</Text>
        <Text style={styles.subtitle}>
          Choose your goal, activity level and weekly rate so we can calculate your daily calorie
          and macro targets.
        </Text>
      </View>

      {profile ? (
        <View style={styles.profileCard}>
          <Text style={styles.cardLabel}>Current profile</Text>

          <View style={styles.profileRow}>
            <Text style={styles.profileText}>Current weight: {profile.current_weight_kg} kg</Text>
            <Text style={styles.profileText}>Target weight: {profile.target_weight_kg} kg</Text>
          </View>
        </View>
      ) : (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Profile missing</Text>
          <Text style={styles.warningText}>
            Please complete your profile setup before creating a goal.
          </Text>

          <AppButton
            title="Go to profile setup"
            variant="secondary"
            onPress={() => router.push('/onboarding/profile')}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What do you want to do?</Text>

        <View style={styles.goalList}>
          {goalOptions.map((option) => {
            const selected = option.type === goalType

            return (
              <Pressable
                key={option.type}
                style={[styles.goalCard, selected ? styles.goalSelected : null]}
                onPress={() => {
                  setGoalType(option.type)

                  if (option.type === 'maintain') {
                    setTargetRateKgPerWeek('0.5')
                  }
                }}
              >
                <Text style={[styles.goalTitle, selected ? styles.goalTitleSelected : null]}>
                  {option.title}
                </Text>

                <Text
                  style={[styles.goalDescription, selected ? styles.goalDescriptionSelected : null]}
                >
                  {option.description}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity level</Text>

        <View style={styles.activityList}>
          {activityLevels.map((level) => {
            const selected = level.id === activityLevelId

            return (
              <Pressable
                key={level.id}
                style={[styles.activityCard, selected ? styles.activitySelected : null]}
                onPress={() => setActivityLevelId(level.id)}
              >
                <View style={styles.activityCardTop}>
                  <Text
                    style={[styles.activityName, selected ? styles.activityNameSelected : null]}
                  >
                    {level.name}
                  </Text>

                  <Text
                    style={[
                      styles.activityMultiplier,
                      selected ? styles.activityMultiplierSelected : null
                    ]}
                  >
                    ×{level.multiplier}
                  </Text>
                </View>

                {level.description ? (
                  <Text
                    style={[
                      styles.activityDescription,
                      selected ? styles.activityDescriptionSelected : null
                    ]}
                  >
                    {level.description}
                  </Text>
                ) : null}
              </Pressable>
            )
          })}
        </View>

        {selectedActivityLevel ? (
          <Text style={styles.selectedHint}>Selected: {selectedActivityLevel.name}</Text>
        ) : null}
      </View>

      {formError ? (
        <View style={styles.errorSpacing}>
          <ErrorCard title="Please check your goal" message={formError} />
        </View>
      ) : null}

      <View style={styles.form}>
        <AppInput
          label="Target rate"
          value={targetRateKgPerWeek}
          onChangeText={setTargetRateKgPerWeek}
          placeholder="Example: 0.5"
          keyboardType="numeric"
          editable={goalType !== 'maintain'}
        />

        <Text style={styles.helperText}>
          Choose how much weight you want to lose or gain per week. A practical range is 0.10 to
          1.00 kg/week. Maintain mode does not need a rate.
        </Text>

        {goalType !== 'maintain' ? (
          <View style={styles.rateChips}>
            {rateOptions.map((rate) => {
              const selected = targetRateKgPerWeek === rate

              return (
                <Pressable
                  key={rate}
                  style={[styles.rateChip, selected ? styles.rateChipSelected : null]}
                  onPress={() => setTargetRateKgPerWeek(rate)}
                >
                  <Text
                    style={[styles.rateChipText, selected ? styles.rateChipTextSelected : null]}
                  >
                    {rate} kg/week
                  </Text>
                </Pressable>
              )
            })}
          </View>
        ) : null}
      </View>

      {selectedGoal ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{selectedGoal.title}</Text>
          <Text style={styles.infoText}>
            The backend will calculate your BMR, TDEE, daily calorie target, protein, carbs and fat
            based on your saved profile, selected activity level and weekly rate.
          </Text>
        </View>
      ) : null}

      <AppButton title="Save goal and view summary" loading={saving} onPress={handleSaveGoal} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    marginBottom: 22
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.text
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 22,
    gap: 10
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase'
  },
  profileRow: {
    gap: 4
  },
  profileText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600'
  },
  warningCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: 16,
    marginBottom: 22,
    gap: 12
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text
  },
  warningText: {
    color: colors.muted,
    lineHeight: 22
  },
  section: {
    marginBottom: 22,
    gap: 12
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text
  },
  goalList: {
    gap: 12
  },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8
  },
  goalSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text
  },
  goalTitleSelected: {
    color: '#FFFFFF'
  },
  goalDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted
  },
  goalDescriptionSelected: {
    color: '#DCFCE7'
  },
  activityList: {
    gap: 12
  },
  activityCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8
  },
  activitySelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  activityCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  activityName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text
  },
  activityNameSelected: {
    color: '#FFFFFF'
  },
  activityMultiplier: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary
  },
  activityMultiplierSelected: {
    color: '#FFFFFF'
  },
  activityDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted
  },
  activityDescriptionSelected: {
    color: '#DCFCE7'
  },
  selectedHint: {
    fontSize: 13,
    color: colors.muted
  },
  form: {
    gap: 12,
    marginBottom: 18
  },
  helperText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted
  },
  rateChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4
  },
  rateChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  rateChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  rateChipText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13
  },
  rateChipTextSelected: {
    color: '#FFFFFF'
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 22,
    gap: 8
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text
  },
  infoText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted
  },
  errorSpacing: {
    marginBottom: 18,
  }
})
