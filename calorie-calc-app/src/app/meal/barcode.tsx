import { router } from 'expo-router'
import { useRef, useState } from 'react'
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native'

import { lookupBarcode, saveBarcodeAsFood } from '@/api/barcodes'
import { ApiError } from '@/api/client'
import { AppButton, AppCard, AppInput, ErrorCard, Screen } from '@/components/ui'
import { colors } from '@/constants/colors'
import { macroTones, radius, shadows, spacing, typography } from '@/constants/theme'
import type { BarcodeLookup } from '@/types/barcodes'

function formatNumber(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return `0${suffix}`
  }

  return `${Math.round(Number(value))}${suffix}`
}

function normalizeBarcodeInput(value: string) {
  return value.replace(/[^0-9]/g, '')
}

export default function BarcodeLookupScreen() {
  const savingRef = useRef(false)

  const [barcode, setBarcode] = useState('')
  const [lookup, setLookup] = useState<BarcodeLookup | null>(null)

  const [loading, setLoading] = useState(false)
  const [savingFood, setSavingFood] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const mappedProduct = lookup?.mapped_product ?? null
  const existingFood = lookup?.food ?? null
  const cleanBarcode = normalizeBarcodeInput(barcode)

  function validateBarcode(): string | null {
    if (cleanBarcode.length < 6 || cleanBarcode.length > 32) {
      return 'Barcode must contain 6 to 32 digits.'
    }

    return null
  }

  async function handleLookup(forceRefresh = false) {
    setFormError(null)

    const validationError = validateBarcode()

    if (validationError) {
      setFormError(validationError)
      Alert.alert('Check barcode', validationError)
      return
    }

    try {
      setLoading(true)

      const response = await lookupBarcode(cleanBarcode, forceRefresh)

      setLookup(response.data.barcode_lookup)
    } catch (error) {
      if (error instanceof ApiError) {
        const isProductNotFound =
          error.status === 404 || error.message.toLowerCase().includes('product not found')

        if (isProductNotFound) {
          setLookup({
            barcode: cleanBarcode,
            provider: 'open_food_facts',
            status: 'not_found',
            status_verbose: 'No product was found for this barcode.',
            product_name: null,
            brand: null,
            mapped_product: null,
            food_id: null,
            food: null
          })

          setFormError(null)
          return
        }

        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null
        const message = firstValidationError ?? error.message

        setFormError(message)
        Alert.alert('Barcode lookup failed', message)
        return
      }

      setFormError('Barcode lookup failed. Please try again.')
      Alert.alert('Barcode lookup failed', 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveAsFood() {
    if (savingRef.current) {
      return
    }

    if (!lookup || lookup.status !== 'found') {
      setFormError('No barcode product is available to save.')
      return
    }

    try {
      savingRef.current = true
      setSavingFood(true)

      await saveBarcodeAsFood(cleanBarcode)

      Alert.alert('Saved', 'Barcode product was saved to your food database.')

      const refreshed = await lookupBarcode(cleanBarcode, true)
      setLookup(refreshed.data.barcode_lookup)
    } catch (error) {
      if (error instanceof ApiError) {
        const firstValidationError = error.errors ? Object.values(error.errors).flat()[0] : null
        const message = firstValidationError ?? error.message

        setFormError(message)
        Alert.alert('Could not save food', message)
        return
      }

      setFormError('Could not save food. Please try again.')
      Alert.alert('Could not save food', 'Please try again.')
    } finally {
      savingRef.current = false
      setSavingFood(false)
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Packaged food</Text>
        <Text style={styles.title}>Barcode lookup</Text>
        <Text style={styles.subtitle}>
          Enter a barcode to search Open Food Facts and save packaged products into your food
          database.
        </Text>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroBubbleOne} />
        <View style={styles.heroBubbleTwo} />

        <View style={styles.heroIcon}>
          <Text style={styles.heroIconText}>▦</Text>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Look up packaged food</Text>
          <Text style={styles.heroText}>
            Use this for grocery items, snacks, drinks, sauces and other products with printed
            barcodes.
          </Text>
        </View>
      </View>

      <AppCard gap={16} style={styles.lookupCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Enter barcode</Text>
          <Text style={styles.cardSubtitle}>Numbers only. Example: 3017624010701</Text>
        </View>

        <AppInput
          label="Barcode"
          value={barcode}
          onChangeText={(value) => {
            setBarcode(normalizeBarcodeInput(value))
            setLookup(null)
            setFormError(null)
          }}
          placeholder="Example: 3017624010701"
          keyboardType="numeric"
        />

        <View style={styles.barcodeHintRow}>
          <Text style={styles.barcodeHint}>
            {cleanBarcode.length > 0
              ? `${cleanBarcode.length} digit(s) entered`
              : 'Barcode must contain 6 to 32 digits.'}
          </Text>
        </View>

        <AppButton title="Lookup barcode" loading={loading} onPress={() => handleLookup(false)} />

        {lookup ? (
          <AppButton
            title="Force refresh from Open Food Facts"
            variant="secondary"
            loading={loading}
            onPress={() => handleLookup(true)}
          />
        ) : null}
      </AppCard>

      {formError ? (
        <View style={styles.errorSpacing}>
          <ErrorCard title="Please check barcode" message={formError} />
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primary} />
          <View style={styles.loadingCopy}>
            <Text style={styles.loadingTitle}>Looking up barcode...</Text>
            <Text style={styles.loadingText}>Checking product data and nutrition details.</Text>
          </View>
        </View>
      ) : null}

      {lookup && lookup.status !== 'found' ? (
        <View style={styles.notFoundCard}>
          <View style={styles.notFoundIcon}>
            <Text style={styles.notFoundIconText}>?</Text>
          </View>

          <View style={styles.notFoundCopy}>
            <Text style={styles.notFoundTitle}>Product not found</Text>
            <Text style={styles.notFoundText}>
              {lookup.status_verbose ?? 'No product was found for this barcode.'}
            </Text>
          </View>

          <AppButton
            title="Create custom food"
            variant="secondary"
            onPress={() => router.push('/meal/custom-food')}
          />
        </View>
      ) : null}

      {lookup && lookup.status === 'found' ? (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={styles.resultStatusPill}>
              <Text style={styles.resultStatusText}>
                {existingFood ? 'Already saved' : 'Product found'}
              </Text>
            </View>

            <Text style={styles.resultBarcode}>Barcode: {lookup.barcode}</Text>
          </View>

          <View style={styles.resultTop}>
            {mappedProduct?.image_front_url ? (
              <Image
                source={{ uri: mappedProduct.image_front_url }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.productImageFallback}>
                <Text style={styles.productImageFallbackText}>📦</Text>
              </View>
            )}

            <View style={styles.resultMain}>
              <Text style={styles.resultLabel}>
                {existingFood ? 'Saved food' : 'Barcode product'}
              </Text>

              <Text style={styles.productName}>
                {existingFood?.name ??
                  mappedProduct?.name ??
                  lookup.product_name ??
                  'Unnamed product'}
              </Text>

              {lookup.brand ? <Text style={styles.productMeta}>{lookup.brand}</Text> : null}

              <Text style={styles.productMeta}>
                {existingFood
                  ? 'Available in your food search.'
                  : 'Ready to save to your database.'}
              </Text>
            </View>
          </View>

          <View style={styles.nutritionGrid}>
            <NutritionCard
              label="Calories"
              value={formatNumber(mappedProduct?.nutrition_per_100g.calories)}
              suffix="kcal/100g"
              color={colors.primary}
              softColor={colors.caloriesSoft}
            />

            <NutritionCard
              label="Protein"
              value={formatNumber(mappedProduct?.nutrition_per_100g.protein_g)}
              suffix="g"
              color={macroTones.protein.color}
              softColor={macroTones.protein.soft}
            />

            <NutritionCard
              label="Carbs"
              value={formatNumber(mappedProduct?.nutrition_per_100g.carbs_g)}
              suffix="g"
              color={macroTones.carbs.color}
              softColor={macroTones.carbs.soft}
            />

            <NutritionCard
              label="Fat"
              value={formatNumber(mappedProduct?.nutrition_per_100g.fat_g)}
              suffix="g"
              color={macroTones.fat.color}
              softColor={macroTones.fat.soft}
            />
          </View>

          {mappedProduct?.data_quality?.has_calories === false ? (
            <ErrorCard
              title="Nutrition may be incomplete"
              message="Open Food Facts did not provide reliable calories for this product. Save it only if you plan to review or edit it later."
              variant="warning"
            />
          ) : null}

          {existingFood ? (
            <View style={styles.savedCard}>
              <View style={styles.savedIcon}>
                <Text style={styles.savedIconText}>✓</Text>
              </View>

              <View style={styles.savedCopy}>
                <Text style={styles.savedTitle}>Already saved</Text>
                <Text style={styles.savedText}>
                  This barcode already exists in your food database. You can find it using food
                  search.
                </Text>
              </View>

              <AppButton title="Go to Add Food" onPress={() => router.push('/(tabs)/add-food')} />
            </View>
          ) : (
            <View style={styles.saveActionCard}>
              <View style={styles.saveActionCopy}>
                <Text style={styles.saveActionTitle}>Save this product?</Text>
                <Text style={styles.saveActionText}>
                  Once saved, it will appear in food search and can be logged from Add Food.
                </Text>
              </View>

              <AppButton title="Save as food" loading={savingFood} onPress={handleSaveAsFood} />
            </View>
          )}
        </View>
      ) : null}
    </Screen>
  )
}

function NutritionCard({
  label,
  value,
  suffix,
  color,
  softColor
}: {
  label: string
  value: string
  suffix: string
  color: string
  softColor: string
}) {
  return (
    <View style={styles.nutritionCard}>
      <View style={[styles.nutritionIcon, { backgroundColor: softColor }]}>
        <View style={[styles.nutritionDot, { backgroundColor: color }]} />
      </View>

      <Text style={styles.nutritionLabel}>{label}</Text>
      <Text style={styles.nutritionValue}>{value}</Text>
      <Text style={styles.nutritionSuffix}>{suffix}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg
  },
  eyebrow: {
    ...typography.tiny,
    color: colors.primary,
    textTransform: 'uppercase'
  },
  title: {
    ...typography.title,
    color: colors.heading
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius['3xl'],
    padding: spacing['2xl'],
    marginBottom: spacing.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
    ...shadows.lg
  },
  heroBubbleOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    top: -60,
    right: -45
  },
  heroBubbleTwo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -45,
    left: -30
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: radius['2xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroIconText: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '900'
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs
  },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900'
  },
  heroText: {
    color: colors.primarySoft,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700'
  },
  lookupCard: {
    marginBottom: spacing.lg
  },
  cardHeader: {
    gap: 3
  },
  cardTitle: {
    color: colors.heading,
    fontSize: 18,
    fontWeight: '900'
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20
  },
  barcodeHintRow: {
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  barcodeHint: {
    color: colors.mutedDark,
    fontSize: 13,
    fontWeight: '800'
  },
  loadingCard: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm
  },
  loadingCopy: {
    flex: 1,
    gap: 2
  },
  loadingTitle: {
    color: colors.heading,
    fontSize: 15,
    fontWeight: '900'
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
    marginBottom: spacing['2xl'],
    ...shadows.md
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'center'
  },
  resultStatusPill: {
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 7
  },
  resultStatusText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  resultBarcode: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  resultTop: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start'
  },
  productImage: {
    width: 92,
    height: 92,
    borderRadius: radius['2xl'],
    backgroundColor: colors.surfaceAlt
  },
  productImageFallback: {
    width: 92,
    height: 92,
    borderRadius: radius['2xl'],
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center'
  },
  productImageFallbackText: {
    fontSize: 36
  },
  resultMain: {
    flex: 1,
    gap: 4
  },
  resultLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  productName: {
    color: colors.heading,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26
  },
  productMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700'
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  nutritionCard: {
    width: '48%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4
  },
  nutritionIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  nutritionDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  nutritionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900'
  },
  nutritionValue: {
    color: colors.heading,
    fontSize: 24,
    fontWeight: '900'
  },
  nutritionSuffix: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },
  notFoundCard: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm
  },
  notFoundIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  notFoundIconText: {
    color: colors.warning,
    fontSize: 22,
    fontWeight: '900'
  },
  notFoundCopy: {
    gap: spacing.xs
  },
  notFoundTitle: {
    color: colors.heading,
    fontSize: 18,
    fontWeight: '900'
  },
  notFoundText: {
    color: colors.mutedDark,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700'
  },
  savedCard: {
    backgroundColor: colors.successSoft,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: spacing.lg,
    gap: spacing.md
  },
  savedIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  savedIconText: {
    color: colors.success,
    fontSize: 22,
    fontWeight: '900'
  },
  savedCopy: {
    gap: spacing.xs
  },
  savedTitle: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900'
  },
  savedText: {
    color: colors.mutedDark,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700'
  },
  saveActionCard: {
    backgroundColor: colors.cardWarm,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    gap: spacing.md
  },
  saveActionCopy: {
    gap: spacing.xs
  },
  saveActionTitle: {
    color: colors.heading,
    fontSize: 16,
    fontWeight: '900'
  },
  saveActionText: {
    color: colors.mutedDark,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700'
  },
  errorSpacing: {
    marginBottom: spacing.lg
  }
})
