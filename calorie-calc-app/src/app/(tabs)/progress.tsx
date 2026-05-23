import { StyleSheet, Text, View } from 'react-native'

import { Screen } from '@/components/ui/Screen'
import { colors } from '@/constants/colors'

export default function ProgressScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Weight logs and nutrition trends will be shown here.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weight progress</Text>
        <Text style={styles.emptyText}>No chart data loaded yet.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nutrition trend</Text>
        <Text style={styles.emptyText}>No trend data loaded yet.</Text>
      </View>
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
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text
  },
  emptyText: {
    marginTop: 8,
    color: colors.muted
  }
})
