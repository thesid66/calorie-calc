import { Platform } from 'react-native'

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
  '3xl': 30,
  '4xl': 36
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  '2xl': 22,
  '3xl': 28,
  pill: 999
}

export const typography = {
  hero: {
    fontSize: 36,
    fontWeight: '900' as const,
    letterSpacing: -1
  },
  title: {
    fontSize: 30,
    fontWeight: '900' as const,
    letterSpacing: -0.8
  },
  heading: {
    fontSize: 22,
    fontWeight: '900' as const,
    letterSpacing: -0.4
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
  },
  tiny: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 0.4
  }
}

export const shadows = {
  sm: Platform.select({
    web: {
      boxShadow: '0 4px 10px rgba(154, 107, 79, 0.08)'
    },
    default: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 2
    }
  }),
  md: Platform.select({
    web: {
      boxShadow: '0 10px 20px rgba(154, 107, 79, 0.12)'
    },
    default: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 4
    }
  }),
  lg: Platform.select({
    web: {
      boxShadow: '0 18px 32px rgba(154, 107, 79, 0.16)'
    },
    default: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.16,
      shadowRadius: 32,
      elevation: 7
    }
  })
}

export const macroTones = {
  calories: {
    color: colors.calories,
    soft: colors.caloriesSoft
  },
  protein: {
    color: colors.protein,
    soft: colors.proteinSoft
  },
  carbs: {
    color: colors.carbs,
    soft: colors.carbsSoft
  },
  fat: {
    color: colors.fat,
    soft: colors.fatSoft
  }
}

export const mealTones = {
  breakfast: {
    emoji: '🌤️',
    label: 'Breakfast',
    color: '#F97316',
    soft: '#FFF7ED'
  },
  lunch: {
    emoji: '☀️',
    label: 'Lunch',
    color: '#F59E0B',
    soft: '#FFFBEB'
  },
  dinner: {
    emoji: '🌙',
    label: 'Dinner',
    color: '#6366F1',
    soft: '#EEF2FF'
  },
  snack: {
    emoji: '🍓',
    label: 'Snack',
    color: '#EC4899',
    soft: '#FCE7F3'
  }
}
