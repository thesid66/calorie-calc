import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors } from '@/constants/colors'
import { radius, shadows, spacing } from '@/constants/theme'

type AppDatePickerProps = {
  label: string
  value: string | null
  onChange: (value: string) => void
  error?: string
  hint?: string
  minimumDate?: Date
  maximumDate?: Date
  disabled?: boolean
  optional?: boolean
}

export function AppDatePicker({
  label,
  value,
  onChange,
  error,
  hint,
  minimumDate,
  maximumDate,
  disabled = false,
  optional = false
}: AppDatePickerProps) {
  const defaultStyles = useDefaultStyles()
  const [open, setOpen] = useState(false)

  const selectedDate = useMemo(() => parseDateValue(value), [value])
  const displayValue = value ? formatDisplayDate(value) : 'Select date'

  const pickerStyles = useMemo(
    () =>
      ({
        ...defaultStyles,

        today: {
          ...defaultStyles.today,
          borderColor: colors.primary,
          borderWidth: 1
        },

        selected: {
          ...defaultStyles.selected,
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          borderRadius: radius.pill
        },

        selected_label: {
          ...defaultStyles.selected_label,
          color: colors.white,
          fontWeight: '900'
        },

        day_label: {
          ...defaultStyles.day_label,
          color: colors.text,
          fontWeight: '800'
        },

        weekday_label: {
          ...defaultStyles.weekday_label,
          color: colors.muted,
          fontWeight: '900'
        },

        month_selector_label: {
          ...defaultStyles.month_selector_label,
          color: colors.text,
          fontWeight: '900'
        },

        year_selector_label: {
          ...defaultStyles.year_selector_label,
          color: colors.text,
          fontWeight: '900'
        },

        disabled_label: {
          ...defaultStyles.disabled_label,
          color: colors.muted,
          opacity: 0.35
        }
      }) as any,
    [defaultStyles]
  )

  function handleDateChange(nextDate: unknown) {
    const normalisedDate = normalisePickerDate(nextDate)

    if (!normalisedDate) {
      return
    }

    onChange(formatDateValue(normalisedDate))
    setOpen(false)
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional ? <Text style={styles.optional}>Optional</Text> : null}
      </View>

      <Pressable
        disabled={disabled}
        style={[
          styles.field,
          open ? styles.fieldFocused : null,
          error ? styles.fieldError : null,
          disabled ? styles.disabled : null
        ]}
        onPress={() => setOpen((current) => !current)}
      >
        <View style={styles.valueWrap}>
          <Text style={[styles.value, !value ? styles.placeholder : null]}>{displayValue}</Text>
          <Text style={styles.formatText}>YYYY-MM-DD</Text>
        </View>

        <Text style={styles.calendarIcon}>📅</Text>
      </Pressable>

      {open ? (
        <View style={styles.calendarCard}>
          <DateTimePicker
            mode="single"
            date={selectedDate}
            minDate={minimumDate}
            maxDate={maximumDate}
            firstDayOfWeek={1}
            showOutsideDays
            styles={pickerStyles}
            onChange={({ date }) => handleDateChange(date)}
          />

          <View style={styles.calendarFooter}>
            <Pressable style={styles.footerButton} onPress={() => setOpen(false)}>
              <Text style={styles.footerButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.footerButton, styles.todayButton]}
              onPress={() => handleDateChange(new Date())}
            >
              <Text style={[styles.footerButtonText, styles.todayButtonText]}>Today</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

export function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function parseDateValue(value: string | null | undefined) {
  if (!value) {
    return new Date()
  }

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    return new Date()
  }

  return new Date(year, month - 1, day)
}

export function formatDisplayDate(value: string) {
  const date = parseDateValue(value)

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

function normalisePickerDate(date: unknown) {
  if (!date) {
    return null
  }

  if (date instanceof Date) {
    return date
  }

  if (typeof date === 'string' || typeof date === 'number') {
    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return null
    }

    return parsedDate
  }

  if (
    typeof date === 'object' &&
    date !== null &&
    'toDate' in date &&
    typeof date.toDate === 'function'
  ) {
    return date.toDate()
  }

  return null
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
  field: {
    minHeight: 56,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...shadows.sm
  },
  fieldFocused: {
    borderColor: colors.primary
  },
  fieldError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft
  },
  disabled: {
    opacity: 0.55
  },
  valueWrap: {
    flex: 1,
    gap: 2
  },
  value: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text
  },
  placeholder: {
    color: colors.muted
  },
  formatText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted
  },
  calendarIcon: {
    fontSize: 22
  },
  calendarCard: {
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
    overflow: 'hidden',
    ...shadows.md
  },
  calendarFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm
  },
  footerButton: {
    minHeight: 38,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt
  },
  footerButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900'
  },
  todayButton: {
    backgroundColor: colors.primary
  },
  todayButtonText: {
    color: colors.white
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
