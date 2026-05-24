import type { PropsWithChildren } from 'react'
import type { StyleProp, ViewProps, ViewStyle } from 'react-native'
import { StyleSheet, View } from 'react-native'

import { colors } from '@/constants/colors'
import { radius, shadows, spacing } from '@/constants/theme'

type AppCardVariant =
  | 'default'
  | 'muted'
  | 'cream'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'protein'
  | 'carbs'
  | 'fat'
  | 'dark'

type AppCardProps = PropsWithChildren<
  ViewProps & {
    variant?: AppCardVariant
    padded?: boolean
    gap?: number
    shadow?: boolean
    style?: StyleProp<ViewStyle>
  }
>

export function AppCard({
  children,
  variant = 'default',
  padded = true,
  gap = spacing.md,
  shadow = true,
  style,
  ...props
}: AppCardProps) {
  return (
    <View
      style={[
        styles.card,
        styles[variant],
        shadow ? styles.shadow : null,
        padded ? styles.padded : null,
        { gap },
        style
      ]}
      {...props}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['3xl'],
    borderWidth: 1,
    overflow: 'hidden'
  },
  shadow: {
    ...shadows.sm
  },
  padded: {
    padding: spacing.lg
  },
  default: {
    backgroundColor: colors.card,
    borderColor: colors.border
  },
  muted: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border
  },
  cream: {
    backgroundColor: colors.surfaceSoft,
    borderColor: '#FFE2CF'
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  success: {
    backgroundColor: colors.successSoft,
    borderColor: '#BBF7D0'
  },
  warning: {
    backgroundColor: colors.warningSoft,
    borderColor: '#FDE68A'
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#FECACA'
  },
  protein: {
    backgroundColor: colors.proteinSoft,
    borderColor: '#C7D2FE'
  },
  carbs: {
    backgroundColor: colors.carbsSoft,
    borderColor: '#FDE68A'
  },
  fat: {
    backgroundColor: colors.fatSoft,
    borderColor: '#FBCFE8'
  },
  dark: {
    backgroundColor: colors.text,
    borderColor: colors.text
  }
})
