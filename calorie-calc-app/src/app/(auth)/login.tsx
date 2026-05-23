import { Link } from 'expo-router'
import { useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { AppButton } from '@/components/ui/AppButton'
import { AppInput } from '@/components/ui/AppInput'
import { Screen } from '@/components/ui/Screen'
import { colors } from '@/constants/colors'
import { APP_NAME } from '@/constants/config'
import { useAuth } from '@/providers/AuthProvider'

export default function LoginScreen() {
  const { signIn } = useAuth()

  const [email, setEmail] = useState('testuser2@gmail.com')
  const [password, setPassword] = useState('Password123')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    try {
      setLoading(true)

      await signIn({
        email,
        password,
        device_name: 'expo-app'
      })
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('Login failed', error.message)
        return
      }

      Alert.alert('Login failed', 'Unable to login. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>🥗</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Login to continue tracking your meals, calories, and progress in {APP_NAME}.
          </Text>
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

          <AppButton title="Login" loading={loading} onPress={handleLogin} />
        </View>

        <Text style={styles.footerText}>
          New here?{' '}
          <Link href="/(auth)/register" style={styles.link}>
            Create an account
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
