import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { getActivityLevels } from '@/api/activityLevels'
import { ApiError } from '@/api/client'
import { getProfile, updateProfile } from '@/api/profile'
import {
  AppButton,
  AppCard,
  AppDatePicker,
  AppInput,
  appToast,
  ErrorCard,
  LoadingState,
  Screen
} from '../../components/ui'
import { colors } from '@/constants/colors'
import { radius, shadows, spacing, typography } from '@/constants/theme'
import type { ActivityLevel, SexForFormula, UnitSystem } from '@/types/profile'

const sexOptions: { value: SexForFormula; label: string; helper: string }[] = [
  { value: 'male', label: 'Male', helper: 'Used for calorie formula' },
  { value: 'female', label: 'Female', helper: 'Used for calorie formula' }
]

const unitOptions: { value: UnitSystem; label: string; helper: string }[] = [
  { value: 'metric', label: 'Metric', helper: 'cm and kg' },
  { value: 'imperial', label: 'Imperial', helper: 'Saved preference' }
]

function toNumber(value: string): number {
  return Number(value.replace(',', '.').trim())
}

function formatDecimal(value: number | string | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return `-${suffix}`
  }

  return `${Number(value).toFixed(1)}${suffix}`
}

function dateYearsAgo(years: number) {
  const date = new Date()
  date.setFullYear(date.getFullYear() - years)

  return date
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

export default function OnboardingProfileScreen() {
  const [activityLevels, setActivityLevels] = useState<ActivityLevel[]>([])
  const [loadingInitialData, setLoadingInitialData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const submittingRef = useRef(false)

  const [sexForFormula, setSexForFormula] = useState<SexForFormula>('male')
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric')
  const [dateOfBirth, setDateOfBirth] = useState('1995-01-01')
  const [heightCm, setHeightCm] = useState('')
  const [currentWeightKg, setCurrentWeightKg] = useState('')
  const [targetWeightKg, setTargetWeightKg] = useState('')
  const [activityLevelId, setActivityLevelId] = useState<number | null>(null)

  const selectedActivityLevel = useMemo(
    () => activityLevels.find((level) => level.id === activityLevelId) ?? null,
    [activityLevels, activityLevelId]
  )

  const selectedSex = useMemo(
    () => sexOptions.find((option) => option.value === sexForFormula) ?? sexOptions[0],
    [sexForFormula]
  )

  const selectedUnit = useMemo(
    () => unitOptions.find((option) => option.value === unitSystem) ?? unitOptions[0],
    [unitSystem]
  )

  async function loadInitialData() {
    try {
      setLoadingInitialData(true)

      const [activityResponse, profileResponse] = await Promise.all([
        getActivityLevels(),
        getProfile()
      ])

      const levels = activityResponse.data.activity_levels

      setActivityLevels(levels)

      if (levels.length > 0) {
        setActivityLevelId(levels[0].id)
      }

      const profile = profileResponse.data.profile

      if (profile) {
        setSexForFormula(profile.sex_for_formula ?? 'male')
        setDateOfBirth(profile.date_of_birth ?? '1995-01-01')
        setHeightCm(String(profile.height_cm ?? ''))
        setUnitSystem(profile.unit_system ?? 'metric')
        setCurrentWeightKg(String(profile.current_weight_kg ?? profile.starting_weight_kg ?? ''))
        setTargetWeightKg(String(profile.target_weight_kg ?? ''))
        setActivityLevelId(profile.activity_level_id ?? profile.activity_level?.id ?? null)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        appToast.error({ title: 'Could not load profile setup', message: error.message })
        return
      }

      appToast.error({
        title: 'Could not load profile setup',
        message: 'Please check your API connection and try again.'
      })
    } finally {
      setLoadingInitialData(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  function validateForm(): string | null {
    if (!dateOfBirth.trim()) {
      return 'Date of birth is required.'
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())) {
      return 'Date of birth must be in YYYY-MM-DD format.'
    }

    if (!heightCm || toNumber(heightCm) < 80 || toNumber(heightCm) > 250) {
      return 'Height must be between 80 and 250 cm.'
    }

    if (!currentWeightKg || toNumber(currentWeightKg) < 20 || toNumber(currentWeightKg) > 400) {
      return 'Current weight must be between 20 and 400 kg.'
    }

    if (!targetWeightKg || toNumber(targetWeightKg) < 20 || toNumber(targetWeightKg) > 400) {
      return 'Target weight must be between 20 and 400 kg.'
    }

    if (!activityLevelId) {
      return 'Please select your activity level.'
    }

    return null
  }

  async function handleContinue() {
    if (submittingRef.current) {
      return
    }

    setFormError(null)

    const validationError = validateForm()

    if (validationError) {
      setFormError(validationError)
      appToast.warning({ title: 'Check your details', message: validationError })
      return
    }

    try {
      submittingRef.current = true
      setSaving(true)

      const setupWeightKg = toNumber(currentWeightKg)

      const payload = {
        unit_system: unitSystem,
        sex_for_formula: sexForFormula,
        date_of_birth: dateOfBirth.trim(),
        height_cm: toNumber(heightCm),

        starting_weight_kg: setupWeightKg,
        current_weight_kg: setupWeightKg,

        target_weight_kg: toNumber(targetWeightKg),
        activity_level_id: Number(activityLevelId)
      }

      await updateProfile(payload)
      blurActiveElement()

      router.push('/onboarding/goal')
    } catch (error) {
      if (error instanceof ApiError) {
        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null
        const message = firstValidationError ?? error.message

        setFormError(message)
        appToast.error({ title: 'Could not save profile', message })

        return
      }

      setFormError('Could not save profile. Please try again.')
      appToast.error({ title: 'Could not save profile', message: 'Please try again.' })
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  if (loadingInitialData) {
    return (
      <Screen scroll={false}>
        <LoadingState message="Loading profile setup..." />
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Step 1 of 3</Text>
        <Text style={styles.title}>Profile setup</Text>
        <Text style={styles.subtitle}>
          These details help calculate your daily calorie and macro target.
        </Text>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroBubbleOne} />
        <View style={styles.heroBubbleTwo} />

        <View style={styles.heroIcon}>
          <Text style={styles.heroIconText}>👤</Text>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Personalise your plan</Text>
          <Text style={styles.heroText}>
            Your profile is used only to estimate calories, macros and weight goals.
          </Text>
        </View>
      </View>

      <View style={styles.previewGrid}>
        <PreviewMetric label="Gender" value={selectedSex.label} />
        <PreviewMetric label="Unit" value={selectedUnit.label} />
        <PreviewMetric label="Current" value={formatDecimal(currentWeightKg, ' kg')} />
        <PreviewMetric label="Target" value={formatDecimal(targetWeightKg, ' kg')} />
      </View>

      <AppCard gap={18} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Basic details</Text>
          <Text style={styles.cardSubtitle}>Used for BMR and daily target calculations.</Text>
        </View>

        <View style={styles.optionBlock}>
          <Text style={styles.optionLabel}>Gender</Text>

          <View style={styles.optionGrid}>
            {sexOptions.map((option) => {
              const selected = sexForFormula === option.value

              return (
                <Pressable
                  key={option.value}
                  style={[styles.optionCard, selected ? styles.optionCardSelected : null]}
                  onPress={() => setSexForFormula(option.value)}
                >
                  <Text style={[styles.optionTitle, selected ? styles.optionTitleSelected : null]}>
                    {option.label}
                  </Text>

                  <Text
                    style={[styles.optionHelper, selected ? styles.optionHelperSelected : null]}
                  >
                    {option.helper}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={styles.optionBlock}>
          <Text style={styles.optionLabel}>Unit system</Text>

          <View style={styles.optionGrid}>
            {unitOptions.map((option) => {
              const selected = unitSystem === option.value

              return (
                <Pressable
                  key={option.value}
                  style={[styles.optionCard, selected ? styles.optionCardSelected : null]}
                  onPress={() => setUnitSystem(option.value)}
                >
                  <Text style={[styles.optionTitle, selected ? styles.optionTitleSelected : null]}>
                    {option.label}
                  </Text>

                  <Text
                    style={[styles.optionHelper, selected ? styles.optionHelperSelected : null]}
                  >
                    {option.helper}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <AppDatePicker
          label="Date of birth"
          value={dateOfBirth}
          onChange={setDateOfBirth}
          maximumDate={dateYearsAgo(13)}
          hint="You must be at least 13 years old."
        />

        <AppInput
          label="Height"
          value={heightCm}
          onChangeText={setHeightCm}
          placeholder="Height in cm"
          keyboardType="numeric"
        />
      </AppCard>

      <AppCard gap={18} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Weight details</Text>
          <Text style={styles.cardSubtitle}>
            Your current weight becomes your starting weight during onboarding.
          </Text>
        </View>

        <View style={styles.form}>
          <AppInput
            label="Current weight"
            value={currentWeightKg}
            onChangeText={setCurrentWeightKg}
            placeholder="Current weight in kg"
            keyboardType="numeric"
          />

          <AppInput
            label="Target weight"
            value={targetWeightKg}
            onChangeText={setTargetWeightKg}
            placeholder="Target weight in kg"
            keyboardType="numeric"
          />
        </View>
      </AppCard>

      <AppCard gap={18} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Activity level</Text>
          <Text style={styles.cardSubtitle}>
            Choose the option closest to your normal weekly activity.
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

      {formError ? (
        <View style={styles.errorSpacing}>
          <ErrorCard title="Please check your details" message={formError} />
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppButton title="Continue to goal setup" loading={saving} onPress={handleContinue} />
      </View>
    </Screen>
  )
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewMetric}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={styles.previewValue}>{value}</Text>
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
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  previewMetric: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    ...shadows.sm
  },
  previewLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900'
  },
  previewValue: {
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
  optionGrid: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  optionCard: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: 4
  },
  optionCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  optionTitle: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900'
  },
  optionTitleSelected: {
    color: colors.white
  },
  optionHelper: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700'
  },
  optionHelperSelected: {
    color: colors.primarySoft
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
  errorSpacing: {
    marginBottom: spacing.lg
  },
  actions: {
    marginBottom: spacing.xl
  }
})
