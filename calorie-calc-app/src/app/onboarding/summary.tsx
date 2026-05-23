import { StyleSheet, Text } from 'react-native'

import { Screen } from '@/components/ui/Screen'
import { colors } from '@/constants/colors'

export default function OnboardingSummaryScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Goal summary</Text>
      <Text style={styles.subtitle}>
        Calculated calories, BMR, TDEE, and macro targets will appear here.
      </Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text
  },
  subtitle: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24
  }
})
