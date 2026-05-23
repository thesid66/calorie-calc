import { StyleSheet, Text, View } from 'react-native'

import { Screen } from '@/components/ui/Screen'
import { colors } from '@/constants/colors'
import { useAuth } from '@/providers/AuthProvider'

export default function DashboardScreen() {
  const { user } = useAuth()

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {user?.name ?? 'there'} 👋</Text>
        <Text style={styles.subtitle}>Today’s calorie and meal summary will appear here.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today</Text>
        <Text style={styles.cardValue}>0 kcal</Text>
        <Text style={styles.cardSubtext}>Diary connection coming next.</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.smallCard}>
          <Text style={styles.smallLabel}>Protein</Text>
          <Text style={styles.smallValue}>0g</Text>
        </View>

        <View style={styles.smallCard}>
          <Text style={styles.smallLabel}>Carbs</Text>
          <Text style={styles.smallValue}>0g</Text>
        </View>

        <View style={styles.smallCard}>
          <Text style={styles.smallLabel}>Fat</Text>
          <Text style={styles.smallValue}>0g</Text>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    marginBottom: 20
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16
  },
  cardTitle: {
    fontSize: 16,
    color: colors.muted
  },
  cardValue: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 8
  },
  cardSubtext: {
    marginTop: 8,
    color: colors.muted
  },
  grid: {
    flexDirection: 'row',
    gap: 12
  },
  smallCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  smallLabel: {
    color: colors.muted,
    fontSize: 13
  },
  smallValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6
  }
})
