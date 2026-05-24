import { useState } from 'react'
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'

import { colors } from '@/constants/colors'
import { radius, spacing, shadows } from '@/constants/theme'

type AppInputProps = TextInputProps & {
  label: string
  error?: string
  hint?: string
  optional?: boolean
}

export function AppInput({
  label,
  error,
  hint,
  optional = false,
  style,
  onFocus,
  onBlur,
  ...props
}: AppInputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional ? <Text style={styles.optional}>Optional</Text> : null}
      </View>

      <TextInput
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          focused ? styles.inputFocused : null,
          error ? styles.inputError : null,
          style
        ]}
        onFocus={(event) => {
          setFocused(true)
          onFocus?.(event)
        }}
        onBlur={(event) => {
          setFocused(false)
          onBlur?.(event)
        }}
        {...props}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 7
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  label: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text
  },
  optional: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase'
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    ...shadows.sm
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft
  },
  error: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18
  }
})
