import type { PressableProps } from 'react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors } from '@/constants/colors'
import { radius, spacing } from '@/constants/theme'

type ChipTone =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'protein'
  | 'carbs'
  | 'fat'

type ChipProps = Omit<PressableProps, 'style'> & {
  label: string
  selected?: boolean
  tone?: ChipTone
  icon?: string
  compact?: boolean
  style?: PressableProps['style']
}

export function Chip({
  label,
  selected = false,
  tone = 'primary',
  icon,
  compact = false,
  disabled,
  style,
  ...props
}: ChipProps) {
  return (
    <Pressable
      disabled={disabled}
      style={(state) => [
        styles.chip,
        compact ? styles.compact : null,
        getToneStyle(tone, selected),
        state.pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        typeof style === 'function' ? style(state) : style
      ]}
      {...props}
    >
      <View style={styles.inner}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={[styles.text, selected ? styles.selectedText : getTextToneStyle(tone)]}>
          {label}
        </Text>
      </View>
    </Pressable>
  )
}

function getToneStyle(tone: ChipTone, selected: boolean) {
  if (selected) {
    if (tone === 'danger') return styles.dangerSelected
    if (tone === 'success') return styles.successSelected
    if (tone === 'warning') return styles.warningSelected
    if (tone === 'protein') return styles.proteinSelected
    if (tone === 'carbs') return styles.carbsSelected
    if (tone === 'fat') return styles.fatSelected
    if (tone === 'default') return styles.defaultSelected

    return styles.primarySelected
  }

  if (tone === 'danger') return styles.danger
  if (tone === 'success') return styles.success
  if (tone === 'warning') return styles.warning
  if (tone === 'protein') return styles.protein
  if (tone === 'carbs') return styles.carbs
  if (tone === 'fat') return styles.fat

  return styles.default
}

function getTextToneStyle(tone: ChipTone) {
  if (tone === 'danger') return styles.dangerText
  if (tone === 'success') return styles.successText
  if (tone === 'warning') return styles.warningText
  if (tone === 'protein') return styles.proteinText
  if (tone === 'carbs') return styles.carbsText
  if (tone === 'fat') return styles.fatText

  return styles.defaultText
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10
  },
  compact: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  icon: {
    fontSize: 13
  },
  default: {
    backgroundColor: colors.card,
    borderColor: colors.border
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#FECACA'
  },
  success: {
    backgroundColor: colors.successSoft,
    borderColor: '#BBF7D0'
  },
  warning: {
    backgroundColor: colors.warningSoft,
    borderColor: '#FDE68A'
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
  defaultSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text
  },
  primarySelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  dangerSelected: {
    backgroundColor: colors.danger,
    borderColor: colors.danger
  },
  successSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  warningSelected: {
    backgroundColor: colors.warning,
    borderColor: colors.warning
  },
  proteinSelected: {
    backgroundColor: colors.protein,
    borderColor: colors.protein
  },
  carbsSelected: {
    backgroundColor: colors.carbs,
    borderColor: colors.carbs
  },
  fatSelected: {
    backgroundColor: colors.fat,
    borderColor: colors.fat
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9
  },
  disabled: {
    opacity: 0.5
  },
  text: {
    fontSize: 13,
    fontWeight: '900'
  },
  selectedText: {
    color: colors.white
  },
  defaultText: {
    color: colors.text
  },
  dangerText: {
    color: colors.danger
  },
  successText: {
    color: colors.success
  },
  warningText: {
    color: '#B45309'
  },
  proteinText: {
    color: colors.protein
  },
  carbsText: {
    color: '#B45309'
  },
  fatText: {
    color: colors.fat
  }
})
