import { StyleSheet, Text, View } from 'react-native'

import { colors } from '@/constants/colors'
import { radius, spacing } from '@/constants/theme'

type ErrorCardVariant = 'error' | 'warning' | 'success' | 'info'

type ErrorCardProps = {
  title?: string
  message: string | null | undefined
  variant?: ErrorCardVariant
}

const variantStyles = {
  error: {
    card: {
      backgroundColor: '#FEF2F2',
      borderColor: '#FECACA'
    },
    text: colors.danger
  },
  warning: {
    card: {
      backgroundColor: '#FFFBEB',
      borderColor: '#FDE68A'
    },
    text: '#92400E'
  },
  success: {
    card: {
      backgroundColor: '#F0FDF4',
      borderColor: '#BBF7D0'
    },
    text: colors.primaryDark
  },
  info: {
    card: {
      backgroundColor: '#EFF6FF',
      borderColor: '#BFDBFE'
    },
    text: '#1D4ED8'
  }
}

export function ErrorCard({ title = 'Please check', message, variant = 'error' }: ErrorCardProps) {
  if (!message) {
    return null
  }

  const selectedVariant = variantStyles[variant]

  return (
    <View style={[styles.card, selectedVariant.card]}>
      <Text style={[styles.title, { color: selectedVariant.text }]}>{title}</Text>
      <Text style={[styles.message, { color: selectedVariant.text }]}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.xs
  },
  title: {
    fontSize: 15,
    fontWeight: '900'
  },
  message: {
    fontSize: 14,
    lineHeight: 20
  }
})
