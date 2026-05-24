import type { PropsWithChildren } from 'react'
import type { StyleProp, ViewProps, ViewStyle } from 'react-native'
import { StyleSheet, View } from 'react-native'

import { colors } from '@/constants/colors'
import { radius, spacing } from '@/constants/theme'

type AppCardVariant = 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'danger'

type AppCardProps = PropsWithChildren<
  ViewProps & {
    variant?: AppCardVariant
    padded?: boolean
    gap?: number
    style?: StyleProp<ViewStyle>
  }
>

export function AppCard({
  children,
  variant = 'default',
  padded = true,
  gap = spacing.md,
  style,
  ...props
}: AppCardProps) {
  return (
    <View
      style={[styles.card, styles[variant], padded ? styles.padded : null, { gap }, style]}
      {...props}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['2xl'],
    borderWidth: 1,
    overflow: 'hidden'
  },
  padded: {
    padding: spacing.lg
  },
  default: {
    backgroundColor: colors.card,
    borderColor: colors.border
  },
  muted: {
    backgroundColor: '#F8FAFC',
    borderColor: colors.border
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  success: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0'
  },
  warning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A'
  },
  danger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  }
})
