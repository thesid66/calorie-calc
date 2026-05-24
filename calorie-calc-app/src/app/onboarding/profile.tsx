import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { getActivityLevels } from '@/api/activityLevels'
import { ApiError } from '@/api/client'
import { getProfile, updateProfile } from '@/api/profile'
import { AppButton, AppInput, LoadingState, Screen } from '@/components/ui'
import { colors } from '@/constants/colors'
import type { ActivityLevel, SexForFormula, UnitSystem } from '@/types/profile'

export default function OnboardingProfileScreen() {
  const [activityLevels, setActivityLevels] = useState<ActivityLevel[]>([])
  const [loadingInitialData, setLoadingInitialData] = useState(true)
  const [saving, setSaving] = useState(false)
  const submittingRef = useRef(false)

  const [sexForFormula, setSexForFormula] = useState<SexForFormula>('male')
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric')
  const [dateOfBirth, setDateOfBirth] = useState('1995-01-01')
  const [heightCm, setHeightCm] = useState('')
  const [currentWeightKg, setCurrentWeightKg] = useState('')
  const [targetWeightKg, setTargetWeightKg] = useState('')
  const [activityLevelId, setActivityLevelId] = useState<number | null>(null)

  const selectedActivityLevel = useMemo(
    () => activityLevels.find((level) => level.id === activityLevelId),
    [activityLevels, activityLevelId]
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
        setSexForFormula(profile.sex_for_formula)
        setDateOfBirth(profile.date_of_birth)
        setHeightCm(String(profile.height_cm))
        setUnitSystem(profile.unit_system ?? 'metric')
        setCurrentWeightKg(String(profile.current_weight_kg ?? profile.starting_weight_kg))
        setTargetWeightKg(String(profile.target_weight_kg ?? ''))
        setActivityLevelId(profile.activity_level_id ?? profile.activity_level?.id ?? null)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('Could not load profile setup', error.message)
        return
      }

      Alert.alert('Could not load profile setup', 'Please check your API connection and try again.')
    } finally {
      setLoadingInitialData(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  function toNumber(value: string): number {
    return Number(value.replace(',', '.').trim())
  }

  function validateForm(): string | null {
    if (!dateOfBirth.trim()) {
      return 'Date of birth is required.'
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())) {
      return 'Date of birth must be in YYYY-MM-DD format.'
    }

    if (!heightCm || toNumber(heightCm) <= 0) {
      return 'Height is required.'
    }

    if (!currentWeightKg || toNumber(currentWeightKg) <= 0) {
      return 'Current weight is required.'
    }

    if (!targetWeightKg || toNumber(targetWeightKg) <= 0) {
      return 'Target weight is required.'
    }

    if (!activityLevelId) {
      return 'Please select your activity level.'
    }

    return null
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

  async function handleContinue() {
    if (submittingRef.current) {
      return
    }

    const validationError = validateForm()

    if (validationError) {
      Alert.alert('Check your details', validationError)
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

        // During initial onboarding, starting and current weight are the same.
        // Later, current_weight_kg will be updated from weight logs.
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

        Alert.alert('Could not save profile', firstValidationError ?? error.message)

        return
      }

      Alert.alert('Could not save profile', 'Please try again.')
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
        <Text style={styles.title}>Profile setup</Text>
        <Text style={styles.subtitle}>
          These details help calculate your daily calorie and macro target.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sex for formula</Text>

        <View style={styles.optionRow}>
          <Pressable
            style={[styles.genderOption, sexForFormula === 'male' ? styles.optionSelected : null]}
            onPress={() => setSexForFormula('male')}
          >
            <Text
              style={[
                styles.optionText,
                sexForFormula === 'male' ? styles.optionTextSelected : null
              ]}
            >
              Male
            </Text>
          </Pressable>

          <Pressable
            style={[styles.genderOption, sexForFormula === 'female' ? styles.optionSelected : null]}
            onPress={() => setSexForFormula('female')}
          >
            <Text
              style={[
                styles.optionText,
                sexForFormula === 'female' ? styles.optionTextSelected : null
              ]}
            >
              Female
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.form}>
        <AppInput
          label="Date of birth"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
        />

        <AppInput
          label="Height"
          value={heightCm}
          onChangeText={setHeightCm}
          placeholder="Height in cm"
          keyboardType="numeric"
        />

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity level</Text>

        <View style={styles.activityList}>
          {activityLevels.map((level) => {
            const selected = level.id === activityLevelId

            return (
              <Pressable
                key={level.id}
                style={[styles.activityCard, selected ? styles.optionSelected : null]}
                onPress={() => setActivityLevelId(level.id)}
              >
                <View style={styles.activityCardTop}>
                  <Text style={[styles.activityName, selected ? styles.optionTextSelected : null]}>
                    {level.name}
                  </Text>

                  <Text
                    style={[styles.activityMultiplier, selected ? styles.optionTextSelected : null]}
                  >
                    ×{level.multiplier}
                  </Text>
                </View>

                {level.description ? (
                  <Text
                    style={[
                      styles.activityDescription,
                      selected ? styles.optionDescriptionSelected : null
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

      <AppButton title="Continue to goal setup" loading={saving} onPress={handleContinue} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    marginBottom: 24
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
  section: {
    marginBottom: 22,
    gap: 12
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12
  },
  genderOption: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  optionTextSelected: {
    color: '#FFFFFF'
  },
  form: {
    gap: 16,
    marginBottom: 24
  },
  activityList: {
    gap: 12
  },
  activityCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
    gap: 8
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
  activityMultiplier: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary
  },
  activityDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted
  },
  optionDescriptionSelected: {
    color: '#DCFCE7'
  },
  selectedHint: {
    fontSize: 13,
    color: colors.muted
  }
})
