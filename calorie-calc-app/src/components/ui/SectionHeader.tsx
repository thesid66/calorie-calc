import { StyleSheet, Text, View } from 'react-native'

import { colors } from '@/constants/colors'
import { spacing, typography } from '@/constants/theme'

type SectionHeaderProps = {
  title: string
  subtitle?: string
  centered?: boolean
}

export function SectionHeader({ title, subtitle, centered = false }: SectionHeaderProps) {
  return (
    <View style={[styles.wrapper, centered ? styles.centered : null]}>
      <Text style={styles.title}>{title}</Text>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs
  },
  centered: {
    alignItems: 'center'
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  }
})
