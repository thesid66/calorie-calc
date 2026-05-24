import { colors } from './colors'

export const Colors = {
  light: colors,
  dark: colors
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 30
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  pill: 999
}

export const typography = {
  title: {
    fontSize: 30,
    fontWeight: '900' as const
  },
  heading: {
    fontSize: 22,
    fontWeight: '900' as const
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900' as const
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const
  },
  bodyStrong: {
    fontSize: 16,
    fontWeight: '800' as const
  },
  caption: {
    fontSize: 13,
    fontWeight: '700' as const
  }
}
