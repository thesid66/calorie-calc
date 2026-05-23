import { StyleSheet, Text, View } from 'react-native'

import { AppButton } from '@/components/ui/AppButton'
import { Screen } from '@/components/ui/Screen'
import { colors } from '@/constants/colors'

export default function AddFoodScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Add Food</Text>
        <Text style={styles.subtitle}>
          Search foods, scan barcode, create custom food, or log manually.
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton title="Search food" />
        <AppButton title="Scan barcode" variant="secondary" />
        <AppButton title="Manual quick entry" variant="secondary" />
        <AppButton title="Create custom food" variant="secondary" />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    marginBottom: 24
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24
  },
  actions: {
    gap: 14
  }
})
