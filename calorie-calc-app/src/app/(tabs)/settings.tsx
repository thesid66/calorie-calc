import { Alert, StyleSheet, Text, View } from 'react-native'

import { AppButton } from '@/components/ui/AppButton'
import { Screen } from '@/components/ui/Screen'
import { colors } from '@/constants/colors'
import { useAuth } from '@/providers/AuthProvider'

export default function SettingsScreen() {
  const { user, signOut } = useAuth()

  async function handleLogout() {
    try {
      await signOut()
    } catch {
      Alert.alert('Logout failed', 'Please try again.')
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage account and app settings.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Logged in as</Text>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <AppButton title="Logout" variant="danger" onPress={handleLogout} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    marginBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20
  },
  label: {
    color: colors.muted,
    fontSize: 13
  },
  name: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '800',
    color: colors.text
  },
  email: {
    marginTop: 4,
    color: colors.muted
  }
})
