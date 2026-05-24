import { ActivityIndicator, Pressable, PressableProps, StyleSheet, Text } from 'react-native'

import { colors } from '@/constants/colors'

type AppButtonProps = PressableProps & {
  title: string
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}

export function AppButton({
  title,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      disabled={isDisabled}
      style={(state) => [
        styles.button,
        styles[variant],
        state.pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        typeof style === 'function' ? style(state) : style
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.text}>{title}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.text
  },
  danger: {
    backgroundColor: colors.danger
  },
  pressed: {
    opacity: 0.85
  },
  disabled: {
    opacity: 0.55
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  }
})
