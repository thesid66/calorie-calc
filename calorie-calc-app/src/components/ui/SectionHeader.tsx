import { StyleSheet, Text, View } from 'react-native'

import { colors } from '@/constants/colors'
import { spacing, typography } from '@/constants/theme'

type SectionHeaderProps = {
  title: string
  subtitle?: string
  eyebrow?: string
  centered?: boolean
}

export function SectionHeader({ title, subtitle, eyebrow, centered = false }: SectionHeaderProps) {
  return (
    <View style={[styles.wrapper, centered ? styles.centered : null]}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}

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
  eyebrow: {
    ...typography.tiny,
    color: colors.primary,
    textTransform: 'uppercase'
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
