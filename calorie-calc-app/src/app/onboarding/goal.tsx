import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { getActivityLevels } from '@/api/activityLevels'
import { ApiError } from '@/api/client'
import { getNutritionGoal, storeNutritionGoal } from '@/api/goals'
import { getProfile } from '@/api/profile'
import {
  AppButton,
  AppCard,
  AppInput,
  Chip,
  ErrorCard,
  LoadingState,
  Screen
} from '@/components/ui'
import { colors } from '@/constants/colors'
import { macroTones, radius, shadows, spacing, typography } from '@/constants/theme'
import type { GoalType } from '@/types/goals'
import type { ActivityLevel, UserProfile } from '@/types/profile'

type GoalOption = {
  type: GoalType
  title: string
  shortTitle: string
  description: string
  helper: string
}

const goalOptions: GoalOption[] = [
  {
    type: 'lose',
    title: 'Lose weight',
    shortTitle: 'Lose',
    description: 'Create a calorie deficit based on your profile and selected weekly rate.',
    helper: 'Best for gradual fat loss'
  },
  {
    type: 'maintain',
    title: 'Maintain weight',
    shortTitle: 'Maintain',
    description: 'Keep your calories close to your daily energy needs.',
    helper: 'Best for stable weight'
  },
  {
    type: 'gain',
    title: 'Gain weight',
    shortTitle: 'Gain',
    description: 'Create a calorie surplus to support gradual weight gain.',
    helper: 'Best for controlled gain'
  }
]

const rateOptions = ['0.25', '0.5', '0.75', '1']

function formatDecimal(value: number | string | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return `-${suffix}`
  }

  return `${Number(value).toFixed(1)}${suffix}`
}

function getWeightDirection(profile: UserProfile | null) {
  if (!profile?.current_weight_kg || !profile?.target_weight_kg) {
    return 'Set your goal based on your profile.'
  }

  if (profile.target_weight_kg < profile.current_weight_kg) {
    return `${formatDecimal(
      Number(profile.current_weight_kg) - Number(profile.target_weight_kg),
      ' kg'
    )} to lose`
  }

  if (profile.target_weight_kg > profile.current_weight_kg) {
    return `${formatDecimal(
      Number(profile.target_weight_kg) - Number(profile.current_weight_kg),
      ' kg'
    )} to gain`
  }

  return 'Target matches current weight'
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
    () => goalOptions.find((option) => option.type === goalType) ?? goalOptions[0],
    [goalType]
  )

  const selectedActivityLevel = useMemo(
    () => activityLevels.find((level) => level.id === activityLevelId) ?? null,
    [activityLevels, activityLevelId]
  )

  const weightDirection = useMemo(() => getWeightDirection(profile), [profile])

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
        <Text style={styles.eyebrow}>Step 2 of 3</Text>
        <Text style={styles.title}>Goal setup</Text>
        <Text style={styles.subtitle}>
          Choose your goal, activity level and weekly rate so we can calculate your daily targets.
        </Text>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroBubbleOne} />
        <View style={styles.heroBubbleTwo} />

        <View style={styles.heroIcon}>
          <Text style={styles.heroIconText}>🎯</Text>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>{selectedGoal.title}</Text>
          <Text style={styles.heroText}>{selectedGoal.helper}</Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaPill}>
              <Text style={styles.heroMetaText}>{selectedGoal.shortTitle.toUpperCase()}</Text>
            </View>

            <View style={styles.heroMetaPill}>
              <Text style={styles.heroMetaText}>
                {goalType === 'maintain' ? 'NO RATE' : `${targetRateKgPerWeek} KG/WEEK`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {profile ? (
        <View style={styles.profileGrid}>
          <ProfileMetric label="Current" value={formatDecimal(profile.current_weight_kg, ' kg')} />
          <ProfileMetric label="Target" value={formatDecimal(profile.target_weight_kg, ' kg')} />
          <ProfileMetric label="Direction" value={weightDirection} />
          <ProfileMetric
            label="Activity"
            value={
              selectedActivityLevel ? `×${formatDecimal(selectedActivityLevel.multiplier)}` : '-'
            }
          />
        </View>
      ) : (
        <AppCard gap={14} style={styles.warningCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile missing</Text>
            <Text style={styles.cardSubtitle}>
              Please complete your profile setup before creating a goal.
            </Text>
          </View>

          <AppButton
            title="Go to profile setup"
            variant="secondary"
            onPress={() => router.push('/onboarding/profile')}
          />
        </AppCard>
      )}

      <AppCard gap={18} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>What do you want to do?</Text>
          <Text style={styles.cardSubtitle}>Your goal controls the calorie adjustment.</Text>
        </View>

        <View style={styles.goalList}>
          {goalOptions.map((option) => {
            const selected = option.type === goalType

            return (
              <Pressable
                key={option.type}
                style={[styles.goalCard, selected ? styles.goalCardSelected : null]}
                onPress={() => {
                  setGoalType(option.type)

                  if (option.type === 'maintain') {
                    setTargetRateKgPerWeek('0.5')
                  }
                }}
              >
                <View style={styles.goalMain}>
                  <Text style={[styles.goalTitle, selected ? styles.goalTitleSelected : null]}>
                    {option.title}
                  </Text>

                  <Text
                    style={[
                      styles.goalDescription,
                      selected ? styles.goalDescriptionSelected : null
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>

                <View style={[styles.checkCircle, selected ? styles.checkCircleSelected : null]}>
                  <Text style={[styles.checkText, selected ? styles.checkTextSelected : null]}>
                    {selected ? '✓' : ''}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      </AppCard>

      <AppCard gap={18} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Activity level</Text>
          <Text style={styles.cardSubtitle}>
            This adjusts your target based on daily movement and exercise.
          </Text>
        </View>

        <View style={styles.activityList}>
          {activityLevels.map((level) => {
            const selected = level.id === activityLevelId

            return (
              <Pressable
                key={level.id}
                style={[styles.activityCard, selected ? styles.activityCardSelected : null]}
                onPress={() => setActivityLevelId(level.id)}
              >
                <View style={styles.activityMain}>
                  <Text
                    style={[styles.activityName, selected ? styles.activityNameSelected : null]}
                  >
                    {level.name}
                  </Text>

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
                    ×{formatDecimal(level.multiplier)}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </View>

        {selectedActivityLevel ? (
          <View style={styles.selectedActivityBox}>
            <Text style={styles.selectedActivityLabel}>Selected activity</Text>
            <Text style={styles.selectedActivityValue}>{selectedActivityLevel.name}</Text>
          </View>
        ) : null}
      </AppCard>

      <AppCard gap={18} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Weekly rate</Text>
          <Text style={styles.cardSubtitle}>
            Choose a practical rate. Maintain mode does not need a weekly rate.
          </Text>
        </View>

        <AppInput
          label="Target rate"
          value={targetRateKgPerWeek}
          onChangeText={setTargetRateKgPerWeek}
          placeholder="Example: 0.5"
          keyboardType="numeric"
          editable={goalType !== 'maintain'}
        />

        {goalType !== 'maintain' ? (
          <View style={styles.rateChips}>
            {rateOptions.map((rate) => (
              <Chip
                key={rate}
                label={`${rate} kg/week`}
                selected={targetRateKgPerWeek === rate}
                onPress={() => setTargetRateKgPerWeek(rate)}
              />
            ))}
          </View>
        ) : (
          <ErrorCard
            title="Maintain mode"
            message="Target rate is not needed when maintaining your current weight."
            variant="info"
          />
        )}

        <View style={styles.rateInfoCard}>
          <Text style={styles.rateInfoTitle}>Practical range</Text>
          <Text style={styles.rateInfoText}>
            A common range is 0.10 to 1.00 kg per week. The backend will calculate BMR, TDEE,
            calories and macros from this setup.
          </Text>
        </View>
      </AppCard>

      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Goal preview</Text>
        <Text style={styles.previewText}>{selectedGoal.description}</Text>

        <View style={styles.previewMacroGrid}>
          <MacroPreview
            label="Calories"
            value="Calculated"
            color={colors.primary}
            softColor={colors.caloriesSoft}
          />
          <MacroPreview
            label="Protein"
            value="Calculated"
            color={macroTones.protein.color}
            softColor={macroTones.protein.soft}
          />
          <MacroPreview
            label="Carbs"
            value="Calculated"
            color={macroTones.carbs.color}
            softColor={macroTones.carbs.soft}
          />
          <MacroPreview
            label="Fat"
            value="Calculated"
            color={macroTones.fat.color}
            softColor={macroTones.fat.soft}
          />
        </View>
      </View>

      {formError ? (
        <View style={styles.errorSpacing}>
          <ErrorCard title="Please check your goal" message={formError} />
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppButton title="Save goal and view summary" loading={saving} onPress={handleSaveGoal} />
      </View>
    </Screen>
  )
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.profileMetric}>
      <Text style={styles.profileMetricLabel}>{label}</Text>
      <Text style={styles.profileMetricValue}>{value}</Text>
    </View>
  )
}

function MacroPreview({
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
    <View style={styles.macroPreview}>
      <View style={[styles.macroIcon, { backgroundColor: softColor }]}>
        <View style={[styles.macroDot, { backgroundColor: color }]} />
      </View>

      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{value}</Text>
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
    fontSize: 32
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
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  heroMetaPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6
  },
  heroMetaText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900'
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  profileMetric: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    ...shadows.sm
  },
  profileMetricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900'
  },
  profileMetricValue: {
    color: colors.heading,
    fontSize: 15,
    fontWeight: '900'
  },
  warningCard: {
    marginBottom: spacing.lg,
    borderColor: colors.warning
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
  goalList: {
    gap: spacing.sm
  },
  goalCard: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
    flexDirection: 'row',
    alignItems: 'center'
  },
  goalCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  goalMain: {
    flex: 1,
    gap: 4
  },
  goalTitle: {
    color: colors.heading,
    fontSize: 17,
    fontWeight: '900'
  },
  goalTitleSelected: {
    color: colors.white
  },
  goalDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700'
  },
  goalDescriptionSelected: {
    color: colors.primarySoft
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white
  },
  checkCircleSelected: {
    borderColor: 'rgba(255, 255, 255, 0.38)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  checkText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '900'
  },
  checkTextSelected: {
    color: colors.white
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
  selectedActivityBox: {
    backgroundColor: colors.cardWarm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    gap: 3
  },
  selectedActivityLabel: {
    color: colors.mutedDark,
    fontSize: 12,
    fontWeight: '900'
  },
  selectedActivityValue: {
    color: colors.heading,
    fontSize: 15,
    fontWeight: '900'
  },
  rateChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  rateInfoCard: {
    backgroundColor: colors.cardWarm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    gap: 4
  },
  rateInfoTitle: {
    color: colors.heading,
    fontSize: 15,
    fontWeight: '900'
  },
  rateInfoText: {
    color: colors.mutedDark,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700'
  },
  previewCard: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm
  },
  previewTitle: {
    color: colors.heading,
    fontSize: 18,
    fontWeight: '900'
  },
  previewText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700'
  },
  previewMacroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  macroPreview: {
    width: '48%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4
  },
  macroIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  macroDot: {
    width: 11,
    height: 11,
    borderRadius: 6
  },
  macroLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900'
  },
  macroValue: {
    color: colors.heading,
    fontSize: 15,
    fontWeight: '900'
  },
  errorSpacing: {
    marginBottom: spacing.lg
  },
  actions: {
    marginBottom: spacing.xl
  }
})
