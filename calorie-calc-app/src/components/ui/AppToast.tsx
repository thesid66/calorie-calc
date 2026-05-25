import React from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import Toast, { ToastConfig, ToastConfigParams, ToastPosition } from 'react-native-toast-message'

type AppToastKind = 'success' | 'error' | 'info' | 'warning'

type AppToastOptions = {
  title?: string
  message?: string
  duration?: number
  position?: ToastPosition
}

const toastMeta: Record<
  AppToastKind,
  {
    icon: string
    title: string
    accent: string
    soft: string
  }
> = {
  success: {
    icon: '✓',
    title: 'Done',
    accent: '#22C55E',
    soft: '#DCFCE7'
  },
  error: {
    icon: '!',
    title: 'Something went wrong',
    accent: '#EF4444',
    soft: '#FEE2E2'
  },
  info: {
    icon: 'i',
    title: 'Info',
    accent: '#FF6B35',
    soft: '#FFE7D8'
  },
  warning: {
    icon: '!',
    title: 'Check this',
    accent: '#F59E0B',
    soft: '#FEF3C7'
  }
}

function AppToastCard({ type, text1, text2, onPress }: ToastConfigParams<Record<string, never>>) {
  const toastType = isAppToastKind(type) ? type : 'info'
  const meta = toastMeta[toastType]

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toast,
        { borderLeftColor: meta.accent },
        pressed && styles.toastPressed
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: meta.soft }]}>
        <Text style={[styles.iconText, { color: meta.accent }]}>{meta.icon}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {text1 || meta.title}
        </Text>

        {!!text2 && (
          <Text style={styles.message} numberOfLines={2}>
            {text2}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

function isAppToastKind(type: string): type is AppToastKind {
  return ['success', 'error', 'info', 'warning'].includes(type)
}

const toastConfig: ToastConfig = {
  success: (props) => <AppToastCard {...props} />,
  error: (props) => <AppToastCard {...props} />,
  info: (props) => <AppToastCard {...props} />,
  warning: (props) => <AppToastCard {...props} />
}

export function AppToastHost() {
  return <Toast config={toastConfig} position="top" topOffset={54} visibilityTime={2800} />
}

function showToast(type: AppToastKind, options: AppToastOptions | string) {
  const normalizedOptions = typeof options === 'string' ? { message: options } : options

  const meta = toastMeta[type]

  Toast.show({
    type,
    text1: normalizedOptions.title || meta.title,
    text2: normalizedOptions.message,
    position: normalizedOptions.position || 'top',
    visibilityTime: normalizedOptions.duration || 2800,
    swipeable: true
  })
}

export const appToast = {
  success(options: AppToastOptions | string) {
    showToast('success', options)
  },

  error(options: AppToastOptions | string) {
    showToast('error', options)
  },

  info(options: AppToastOptions | string) {
    showToast('info', options)
  },

  warning(options: AppToastOptions | string) {
    showToast('warning', options)
  },

  hide() {
    Toast.hide()
  }
}

const styles = StyleSheet.create({
  toast: {
    width: '92%',
    minHeight: 68,
    borderLeftWidth: 5,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 18px rgba(17, 24, 39, 0.14)'
      },
      default: {
        shadowColor: '#111827',
        shadowOpacity: 0.14,
        shadowRadius: 18,
        shadowOffset: {
          width: 0,
          height: 8
        },
        elevation: 8
      }
    })
  },
  toastPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }]
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  iconText: {
    fontSize: 18,
    fontWeight: '900'
  },
  content: {
    flex: 1
  },
  title: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800'
  },
  message: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3
  }
})
