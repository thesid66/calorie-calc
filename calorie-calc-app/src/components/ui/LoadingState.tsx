import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

import { colors } from '@/constants/colors'
import { spacing } from '@/constants/theme'

type LoadingStateProps = {
  message?: string
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <View style={styles.wrapper}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md
  },
  text: {
    color: colors.muted,
    fontSize: 15
  }
})
