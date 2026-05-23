import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'

import { colors } from '@/constants/colors'

type AppInputProps = TextInputProps & {
  label: string
  error?: string
}

export function AppInput({ label, error, style, ...props }: AppInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text
  },
  inputError: {
    borderColor: colors.danger
  },
  error: {
    fontSize: 13,
    color: colors.danger
  }
})
