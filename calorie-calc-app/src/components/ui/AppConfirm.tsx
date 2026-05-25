import React, { createContext, ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import { colors } from '@/constants/colors'
import { radius, shadows, spacing } from '@/constants/theme'

type AppConfirmVariant = 'default' | 'danger'

type AppConfirmOptions = {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
}

type ActiveConfirm = AppConfirmOptions & {
  variant: AppConfirmVariant
}

type AppConfirmApi = {
  confirm: (options: AppConfirmOptions) => Promise<boolean>
  danger: (options: AppConfirmOptions) => Promise<boolean>
}

const AppConfirmContext = createContext<AppConfirmApi | null>(null)

export function AppConfirmProvider({ children }: { children: ReactNode }) {
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null)
  const [activeConfirm, setActiveConfirm] = useState<ActiveConfirm | null>(null)

  const openConfirm = useCallback((options: AppConfirmOptions, variant: AppConfirmVariant) => {
    if (resolverRef.current) {
      resolverRef.current(false)
    }

    setActiveConfirm({
      ...options,
      variant
    })

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const settleConfirm = useCallback((confirmed: boolean) => {
    if (resolverRef.current) {
      resolverRef.current(confirmed)
      resolverRef.current = null
    }

    setActiveConfirm(null)
  }, [])

  const appConfirm = useMemo<AppConfirmApi>(
    () => ({
      confirm(options) {
        return openConfirm(options, 'default')
      },

      danger(options) {
        return openConfirm(options, 'danger')
      }
    }),
    [openConfirm]
  )

  const isDanger = activeConfirm?.variant === 'danger'
  const accentColor = isDanger ? '#EF4444' : colors.primary
  const softColor = isDanger ? '#FEE2E2' : colors.primarySoft
  const iconText = isDanger ? '!' : '?'

  return (
    <AppConfirmContext.Provider value={appConfirm}>
      {children}

      <Modal
        visible={!!activeConfirm}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => settleConfirm(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => settleConfirm(false)} />

          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: softColor }]}>
              <Text style={[styles.iconText, { color: accentColor }]}>{iconText}</Text>
            </View>

            <View style={styles.copy}>
              <Text style={styles.title}>{activeConfirm?.title}</Text>

              {!!activeConfirm?.message && (
                <Text style={styles.message}>{activeConfirm.message}</Text>
              )}
            </View>

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
                onPress={() => settleConfirm(false)}
              >
                <Text style={styles.cancelText}>{activeConfirm?.cancelText ?? 'Cancel'}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.confirmButton,
                  { backgroundColor: accentColor },
                  pressed && styles.buttonPressed
                ]}
                onPress={() => settleConfirm(true)}
              >
                <Text style={styles.confirmText}>{activeConfirm?.confirmText ?? 'Confirm'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppConfirmContext.Provider>
  )
}

export function useAppConfirm() {
  const context = React.useContext(AppConfirmContext)

  if (!context) {
    throw new Error('useAppConfirm must be used inside AppConfirmProvider.')
  }

  return context
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(17, 24, 39, 0.48)'
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radius['3xl'],
    padding: spacing.xl,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    ...shadows.lg
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconText: {
    fontSize: 24,
    fontWeight: '900'
  },
  copy: {
    gap: spacing.sm
  },
  title: {
    color: colors.heading,
    fontSize: 21,
    fontWeight: '900'
  },
  message: {
    color: colors.mutedDark,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700'
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.cardWarm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  confirmButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }]
  },
  cancelText: {
    color: colors.heading,
    fontSize: 14,
    fontWeight: '900'
  },
  confirmText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900'
  }
})
