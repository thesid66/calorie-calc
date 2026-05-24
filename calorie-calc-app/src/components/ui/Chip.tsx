import type { PressableProps } from 'react-native'
import { Pressable, StyleSheet, Text } from 'react-native'

import { colors } from '@/constants/colors'
import { radius, spacing } from '@/constants/theme'

type ChipTone = 'default' | 'primary' | 'danger'

type ChipProps = Omit<PressableProps, 'style'> & {
  label: string
  selected?: boolean
  tone?: ChipTone
  style?: PressableProps['style']
}

export function Chip({
  label,
  selected = false,
  tone = 'primary',
  disabled,
  style,
  ...props
}: ChipProps) {
  function getSelectedStyle() {
    if (!selected) {
      return styles.default
    }

    if (tone === 'danger') {
      return styles.dangerSelected
    }

    if (tone === 'default') {
      return styles.defaultSelected
    }

    return styles.primarySelected
  }

  return (
    <Pressable
      disabled={disabled}
      style={(state) => [
        styles.chip,
        getSelectedStyle(),
        state.pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        typeof style === 'function' ? style(state) : style
      ]}
      {...props}
    >
      <Text style={[styles.text, selected ? styles.selectedText : null]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9
  },
  default: {
    backgroundColor: '#F8FAFC',
    borderColor: colors.border
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
  pressed: {
    opacity: 0.85
  },
  disabled: {
    opacity: 0.5
  },
  text: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800'
  },
  selectedText: {
    color: '#FFFFFF'
  }
})
