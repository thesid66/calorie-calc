import { ActivityIndicator, Pressable, PressableProps, StyleSheet, Text, View } from 'react-native'

import { colors } from '@/constants/colors'
import { radius, shadows } from '@/constants/theme'

type AppButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'outline'
  | 'ghost'

type AppButtonSize = 'sm' | 'md' | 'lg'

type AppButtonProps = PressableProps & {
  title: string
  loading?: boolean
  variant?: AppButtonVariant
  size?: AppButtonSize
  icon?: string
  fullWidth?: boolean
}

export function AppButton({
  title,
  loading = false,
  variant = 'primary',
  size = 'lg',
  icon,
  fullWidth = false,
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || loading
  const isLightText = !['outline', 'ghost', 'warning'].includes(variant)

  return (
    <Pressable
      disabled={isDisabled}
      style={(state) => [
        styles.button,
        styles[size],
        styles[variant],
        fullWidth ? styles.fullWidth : null,
        state.pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        typeof style === 'function' ? style(state) : style
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={isLightText ? colors.white : colors.text} />
      ) : (
        <View style={styles.inner}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={[styles.text, isLightText ? styles.lightText : styles.darkText]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1
  },
  sm: {
    minHeight: 38,
    paddingHorizontal: 14
  },
  md: {
    minHeight: 46
  },
  lg: {
    minHeight: 54
  },
  fullWidth: {
    width: '100%'
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.sm
  },
  secondary: {
    backgroundColor: colors.text,
    borderColor: colors.text
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger
  },
  success: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  warning: {
    backgroundColor: colors.warning,
    borderColor: colors.warning
  },
  outline: {
    backgroundColor: colors.card,
    borderColor: colors.borderStrong
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent'
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9
  },
  disabled: {
    opacity: 0.55
  },
  icon: {
    fontSize: 16
  },
  text: {
    fontSize: 15,
    fontWeight: '900'
  },
  lightText: {
    color: colors.white
  },
  darkText: {
    color: colors.text
  }
})
