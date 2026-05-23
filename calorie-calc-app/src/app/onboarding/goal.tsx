import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { getNutritionGoal, storeNutritionGoal } from '@/api/goals'
import { getProfile } from '@/api/profile'
import { AppButton } from '@/components/ui/AppButton'
import { AppInput } from '@/components/ui/AppInput'
import { Screen } from '@/components/ui/Screen'
import { colors } from '@/constants/colors'
import type { GoalType } from '@/types/goals'
import type { UserProfile } from '@/types/profile'

type GoalOption = {
  type: GoalType
  title: string
  description: string
}

const goalOptions: GoalOption[] = [
  {
    type: 'lose',
    title: 'Lose weight',
    description: 'Create a calorie deficit based on your profile and target.'
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

export default function OnboardingGoalScreen() {
  const submittingRef = useRef(false)

  const [loadingInitialData, setLoadingInitialData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [goalType, setGoalType] = useState<GoalType>('lose')
  const [targetWeightKg, setTargetWeightKg] = useState('')
  const [targetDate, setTargetDate] = useState('')

  const selectedGoal = useMemo(
    () => goalOptions.find((option) => option.type === goalType),
    [goalType]
  )

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    try {
      setLoadingInitialData(true)

      const [profileResponse, goalResponse] = await Promise.all([getProfile(), getNutritionGoal()])

      const loadedProfile = profileResponse.data.profile
      const existingGoal = goalResponse.data.nutrition_goal

      setProfile(loadedProfile)

      if (existingGoal) {
        setGoalType(existingGoal.goal_type)
        setTargetWeightKg(
          existingGoal.target_weight_kg
            ? String(existingGoal.target_weight_kg)
            : loadedProfile?.target_weight_kg
              ? String(loadedProfile.target_weight_kg)
              : ''
        )
        setTargetDate(existingGoal.target_date ?? '')
        return
      }

      if (loadedProfile?.target_weight_kg) {
        setTargetWeightKg(String(loadedProfile.target_weight_kg))
      }

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

  function getProfileActivityLevelId(profileData: UserProfile | null): number | null {
    if (!profileData) {
      return null
    }

    if (profileData.activity_level_id) {
      return Number(profileData.activity_level_id)
    }

    if (profileData.activity_level?.id) {
      return Number(profileData.activity_level.id)
    }

    return null
  }

  function validateForm(): string | null {
    if (!profile) {
      return 'Please complete your profile setup first.'
    }

    if (!getProfileActivityLevelId(profile)) {
      return 'Activity level is missing. Please go back and complete your profile setup.'
    }

    if (goalType !== 'maintain') {
      const targetWeight = toNullableNumber(targetWeightKg)

      if (!targetWeight || targetWeight <= 0) {
        return 'Target weight is required.'
      }

      if (
        goalType === 'lose' &&
        profile.current_weight_kg &&
        targetWeight >= profile.current_weight_kg
      ) {
        return 'For weight loss, target weight should be lower than current weight.'
      }

      if (
        goalType === 'gain' &&
        profile.current_weight_kg &&
        targetWeight <= profile.current_weight_kg
      ) {
        return 'For weight gain, target weight should be higher than current weight.'
      }
    }

    if (targetDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate.trim())) {
      return 'Target date must be in YYYY-MM-DD format.'
    }

    return null
  }

  async function handleSaveGoal() {
    console.log('SAVE GOAL CLICKED')

    if (submittingRef.current) {
      console.log('Goal submit blocked because request is already running.')
      return
    }

    setFormError(null)

    const validationError = validateForm()

    if (validationError) {
      console.log('GOAL VALIDATION ERROR:', validationError)
      setFormError(validationError)
      Alert.alert('Check your goal', validationError)
      return
    }

    try {
      submittingRef.current = true
      setSaving(true)

      const activityLevelId = getProfileActivityLevelId(profile)

      const payload = {
        activity_level_id: Number(activityLevelId),
        goal_type: goalType,
        target_weight_kg:
          goalType === 'maintain'
            ? Number(profile?.current_weight_kg)
            : toNullableNumber(targetWeightKg),
        target_date: targetDate.trim() || null
      }

      console.log('GOAL PAYLOAD:', payload)

      await storeNutritionGoal(payload)

      blurActiveElement()

      router.push('/onboarding/summary')
    } catch (error) {
      if (error instanceof ApiError) {
        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null

        const message = firstValidationError ?? error.message

        console.log('GOAL API ERROR:', {
          message,
          errors: error.errors
        })

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
        <View style={styles.loadingWrapper}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading goal setup...</Text>
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Goal setup</Text>
        <Text style={styles.subtitle}>
          Choose your goal so we can calculate your daily calorie and macro targets.
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
                onPress={() => setGoalType(option.type)}
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
      {formError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Please check your goal</Text>
          <Text style={styles.errorText}>{formError}</Text>
        </View>
      ) : null}
      <View style={styles.form}>
        <AppInput
          label="Target weight"
          value={targetWeightKg}
          onChangeText={setTargetWeightKg}
          placeholder="Target weight in kg"
          keyboardType="numeric"
          editable={goalType !== 'maintain'}
        />

        <AppInput
          label="Target date"
          value={targetDate}
          onChangeText={setTargetDate}
          placeholder="YYYY-MM-DD, optional"
          autoCapitalize="none"
        />
      </View>

      {selectedGoal ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{selectedGoal.title}</Text>
          <Text style={styles.infoText}>
            The backend will calculate your BMR, TDEE, target calories, protein, carbs, and fat
            based on your saved profile.
          </Text>
        </View>
      ) : null}

      <AppButton title="Save goal and view summary" loading={saving} onPress={handleSaveGoal} />
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
  form: {
    gap: 16,
    marginBottom: 18
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
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    marginBottom: 18,
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
  }
})
