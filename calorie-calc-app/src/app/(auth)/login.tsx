import { Link } from 'expo-router'
import { useRef, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { AppButton, AppCard, AppInput, ErrorCard, Screen } from '@/components/ui'
import { colors } from '@/constants/colors'
import { APP_NAME } from '@/constants/config'
import { radius, shadows, spacing, typography } from '@/constants/theme'
import { useAuth } from '@/providers/AuthProvider'

function validateLogin(email: string, password: string): string | null {
  if (!email.trim()) {
    return 'Email is required.'
  }

  if (!email.includes('@')) {
    return 'Please enter a valid email address.'
  }

  if (!password.trim()) {
    return 'Password is required.'
  }

  return null
}

export default function LoginScreen() {
  const { signIn } = useAuth()
  const submittingRef = useRef(false)

  const [email, setEmail] = useState('testuser2@gmail.com')
  const [password, setPassword] = useState('Password123')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleLogin() {
    if (submittingRef.current) {
      return
    }

    setFormError(null)

    const validationError = validateLogin(email, password)

    if (validationError) {
      setFormError(validationError)
      Alert.alert('Check login details', validationError)
      return
    }

    try {
      submittingRef.current = true
      setLoading(true)

      await signIn({
        email: email.trim(),
        password,
        device_name: 'expo-app'
      })
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message)
        Alert.alert('Login failed', error.message)
        return
      }

      setFormError('Unable to login. Please try again.')
      Alert.alert('Login failed', 'Unable to login. Please try again.')
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Welcome to</Text>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>
            Track meals, calories, macros and progress with a simple daily food diary.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBubbleOne} />
          <View style={styles.heroBubbleTwo} />

          <View style={styles.logoCircle}>
            <Text style={styles.logo}>🥗</Text>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Your Daily Plate</Text>
            <Text style={styles.heroText}>
              Continue your nutrition journey and keep your daily targets on track.
            </Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <FeaturePill label="Meals" />
          <FeaturePill label="Macros" />
          <FeaturePill label="Progress" />
        </View>

        <AppCard gap={18} style={styles.loginCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Login</Text>
            <Text style={styles.cardSubtitle}>Enter your account details to continue.</Text>
          </View>

          <View style={styles.form}>
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
              placeholder="Your password"
            />
          </View>

          {formError ? <ErrorCard title="Login failed" message={formError} /> : null}

          <AppButton title="Login" loading={loading} onPress={handleLogin} />
        </AppCard>

        <View style={styles.footerCard}>
          <Text style={styles.footerText}>
            New here?{' '}
            <Link href="/(auth)/register" style={styles.link}>
              Create an account
            </Link>
          </Text>
        </View>
      </View>
    </Screen>
  )
}

function FeaturePill({ label }: { label: string }) {
  return (
    <View style={styles.featurePill}>
      <View style={styles.featureDot} />
      <Text style={styles.featureText}>{label}</Text>
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
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  featurePill: {
    flex: 1,
    minWidth: 95,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    ...shadows.sm
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success
  },
  featureText: {
    color: colors.heading,
    fontSize: 13,
    fontWeight: '900'
  },
  loginCard: {
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
    alignItems: 'center'
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
