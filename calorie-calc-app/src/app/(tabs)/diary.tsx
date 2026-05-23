import { StyleSheet, Text, View } from 'react-native'

import { Screen } from '@/components/ui/Screen'
import { colors } from '@/constants/colors'

export default function DiaryScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Diary</Text>
        <Text style={styles.subtitle}>
          Meal groups and daily nutrition summary will be connected here.
        </Text>
      </View>

      {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((meal) => (
        <View key={meal} style={styles.card}>
          <Text style={styles.cardTitle}>{meal}</Text>
          <Text style={styles.emptyText}>No food logged yet.</Text>
        </View>
      ))}
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
