import { Link, router } from 'expo-router'
import { useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { AppButton, AppCard, AppInput, appToast, ErrorCard, Screen } from '../../components/ui'
import { colors } from '@/constants/colors'
import { APP_NAME } from '@/constants/config'
import { radius, shadows, spacing, typography } from '@/constants/theme'
import { useAuth } from '@/providers/AuthProvider'

function validateRegister({
  name,
  email,
  password,
  passwordConfirmation
}: {
  name: string
  email: string
  password: string
  passwordConfirmation: string
}): string | null {
  if (!name.trim()) {
    return 'Name is required.'
  }

  if (!email.trim()) {
    return 'Email is required.'
  }

  if (!email.includes('@')) {
    return 'Please enter a valid email address.'
  }

  if (!password.trim()) {
    return 'Password is required.'
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters.'
  }

  if (password !== passwordConfirmation) {
    return 'Password confirmation does not match.'
  }

  return null
}

export default function RegisterScreen() {
  const { signUp } = useAuth()
  const submittingRef = useRef(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleRegister() {
    if (submittingRef.current) {
      return
    }

    setFormError(null)

    const validationError = validateRegister({
      name,
      email,
      password,
      passwordConfirmation
    })

    if (validationError) {
      setFormError(validationError)
      appToast.warning({ title: 'Check account details', message: validationError })
      return
    }

    try {
      submittingRef.current = true
      setLoading(true)

      await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
        device_name: 'expo-app'
      })

      router.replace('/onboarding/profile')
    } catch (error) {
      if (error instanceof ApiError) {
        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null
        const message = firstValidationError ?? error.message

        setFormError(message)
        appToast.error({ title: 'Registration failed', message })
        return
      }

      setFormError('Unable to create account. Please try again.')
      appToast.error({
        title: 'Registration failed',
        message: 'Unable to create account. Please try again.'
      })
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Start with</Text>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>
            Create your account and set up your calorie, macro and progress tracking.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBubbleOne} />
          <View style={styles.heroBubbleTwo} />

          <View style={styles.logoCircle}>
            <Text style={styles.logo}>🥗</Text>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Build your daily food plan</Text>
            <Text style={styles.heroText}>
              Track Nepali, South Asian, packaged and custom foods in one place.
            </Text>
          </View>
        </View>

        <View style={styles.featureGrid}>
          <FeatureCard title="Meals" text="Daily food diary" />
          <FeatureCard title="Goals" text="Calories and macros" />
          <FeatureCard title="Progress" text="Weight tracking" />
        </View>

        <AppCard gap={18} style={styles.registerCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Create account</Text>
            <Text style={styles.cardSubtitle}>Use your email and password to start tracking.</Text>
          </View>

          <View style={styles.form}>
            <AppInput label="Name" value={name} onChangeText={setName} placeholder="Your name" />

            <AppInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />

            <AppInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Minimum 8 characters"
            />

            <AppInput
              label="Confirm password"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              secureTextEntry
              placeholder="Repeat password"
            />
          </View>

          {formError ? <ErrorCard title="Registration failed" message={formError} /> : null}

          <AppButton title="Create account" loading={loading} onPress={handleRegister} />
        </AppCard>

        <View style={styles.footerCard}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Link href="/(auth)/login" style={styles.link}>
              Login
            </Link>
          </Text>
        </View>
      </View>
    </Screen>
  )
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureDot} />
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screenContent: {
    justifyContent: 'center'
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg
  },
  header: {
    gap: spacing.xs
  },
  eyebrow: {
    ...typography.tiny,
    color: colors.primary,
    textTransform: 'uppercase'
  },
  appName: {
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
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
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
  logoCircle: {
    width: 66,
    height: 66,
    borderRadius: radius['2xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)'
  },
  logo: {
    fontSize: 34
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
  featureGrid: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  featureCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 3,
    ...shadows.sm
  },
  featureDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.success,
    marginBottom: spacing.xs
  },
  featureTitle: {
    color: colors.heading,
    fontSize: 13,
    fontWeight: '900'
  },
  featureText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700'
  },
  registerCard: {
    ...shadows.sm
  },
  cardHeader: {
    gap: 3
  },
  cardTitle: {
    color: colors.heading,
    fontSize: 22,
    fontWeight: '900'
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700'
  },
  form: {
    gap: spacing.md
  },
  footerCard: {
    backgroundColor: colors.cardWarm,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  footerText: {
    textAlign: 'center',
    fontSize: 15,
    color: colors.mutedDark,
    fontWeight: '700'
  },
  link: {
    color: colors.primary,
    fontWeight: '900'
  }
})
