import { PropsWithChildren } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'

import { colors } from '@/constants/colors'

type ScreenProps = PropsWithChildren<{
  scroll?: boolean
  padded?: boolean
  decorated?: boolean
  contentStyle?: StyleProp<ViewStyle>
}>

export function Screen({
  children,
  scroll = true,
  padded = true,
  decorated = true,
  contentStyle
}: ScreenProps) {
  const content = (
    <View style={[styles.content, padded ? styles.padded : null, contentStyle]}>{children}</View>
  )

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {decorated ? (
        <View pointerEvents="none" style={styles.decorLayer}>
          <View style={styles.decorOne} />
          <View style={styles.decorTwo} />
          <View style={styles.decorThree} />
        </View>
      ) : null}

      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    flexGrow: 1
  },
  content: {
    flex: 1
  },
  padded: {
    padding: 20
  },
  decorLayer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden'
  },
  decorOne: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#FFE1D3',
    opacity: 0.8
  },
  decorTwo: {
    position: 'absolute',
    top: 130,
    left: -120,
    width: 230,
    height: 230,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
    opacity: 0.55
  },
  decorThree: {
    position: 'absolute',
    bottom: -120,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    opacity: 0.65
  }
})
