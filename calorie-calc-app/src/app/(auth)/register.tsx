import { Link } from 'expo-router'
import { useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { AppButton } from '@/components/ui/AppButton'
import { AppInput } from '@/components/ui/AppInput'
import { Screen } from '@/components/ui/Screen'
import { colors } from '@/constants/colors'
import { useAuth } from '@/providers/AuthProvider'

export default function RegisterScreen() {
  const { signUp } = useAuth()

  const [name, setName] = useState('Test User')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('Password123')
  const [passwordConfirmation, setPasswordConfirmation] = useState('Password123')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    try {
      setLoading(true)

      await signUp({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        device_name: 'expo-app'
      })
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('Registration failed', error.message)
        return
      }

      Alert.alert('Registration failed', 'Unable to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>🥗</Text>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Start tracking Nepali, South Asian, packaged, and custom foods.
          </Text>
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

          <AppButton title="Create account" loading={loading} onPress={handleRegister} />
        </View>

        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Link href="/(auth)/login" style={styles.link}>
            Login
          </Link>
        </Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 30
  },
  header: {
    gap: 10
  },
  logo: {
    fontSize: 44
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted
  },
  form: {
    gap: 16
  },
  footerText: {
    textAlign: 'center',
    fontSize: 15,
    color: colors.muted
  },
  link: {
    color: colors.primary,
    fontWeight: '700'
  }
})
