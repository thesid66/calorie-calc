import { router } from 'expo-router'
import { useRef, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'

import { lookupBarcode, saveBarcodeAsFood } from '@/api/barcodes'
import { ApiError } from '@/api/client'
import { AppButton } from '@/components/ui/AppButton'
import { AppInput } from '@/components/ui/AppInput'
import { Screen } from '@/components/ui/Screen'
import { colors } from '@/constants/colors'
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

  function validateBarcode(): string | null {
    const cleanBarcode = normalizeBarcodeInput(barcode)

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

      const cleanBarcode = normalizeBarcodeInput(barcode)
      const response = await lookupBarcode(cleanBarcode, forceRefresh)

      setLookup(response.data.barcode_lookup)
    } catch (error) {
      if (error instanceof ApiError) {
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

      const cleanBarcode = normalizeBarcodeInput(barcode)
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
        <Text style={styles.title}>Barcode Lookup</Text>
        <Text style={styles.subtitle}>
          Enter a packaged food barcode to check Open Food Facts and save it to your local food
          database.
        </Text>
      </View>

      <View style={styles.card}>
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

        <AppButton title="Lookup barcode" loading={loading} onPress={() => handleLookup(false)} />

        {lookup ? (
          <AppButton
            title="Force refresh from Open Food Facts"
            variant="secondary"
            loading={loading}
            onPress={() => handleLookup(true)}
          />
        ) : null}
      </View>

      {formError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Please check barcode</Text>
          <Text style={styles.errorText}>{formError}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Looking up barcode...</Text>
        </View>
      ) : null}

      {lookup && lookup.status !== 'found' ? (
        <View style={styles.notFoundCard}>
          <Text style={styles.notFoundTitle}>Product not found</Text>
          <Text style={styles.notFoundText}>
            {lookup.status_verbose ?? 'No product was found for this barcode.'}
          </Text>
        </View>
      ) : null}

      {lookup && lookup.status === 'found' ? (
        <View style={styles.resultCard}>
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

              <Text style={styles.productMeta}>Barcode: {lookup.barcode}</Text>
            </View>
          </View>

          <View style={styles.nutritionGrid}>
            <NutritionCard
              label="Calories"
              value={formatNumber(mappedProduct?.nutrition_per_100g.calories)}
              suffix="kcal/100g"
            />

            <NutritionCard
              label="Protein"
              value={formatNumber(mappedProduct?.nutrition_per_100g.protein_g)}
              suffix="g"
            />

            <NutritionCard
              label="Carbs"
              value={formatNumber(mappedProduct?.nutrition_per_100g.carbs_g)}
              suffix="g"
            />

            <NutritionCard
              label="Fat"
              value={formatNumber(mappedProduct?.nutrition_per_100g.fat_g)}
              suffix="g"
            />
          </View>

          {mappedProduct?.data_quality?.has_calories === false ? (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>Nutrition may be incomplete</Text>
              <Text style={styles.warningText}>
                Open Food Facts did not provide reliable calories for this product. Save it only if
                you plan to review or edit it later.
              </Text>
            </View>
          ) : null}

          {existingFood ? (
            <View style={styles.savedCard}>
              <Text style={styles.savedTitle}>Already saved</Text>
              <Text style={styles.savedText}>
                This barcode already exists in your food database. You can find it using food
                search.
              </Text>

              <AppButton title="Go to Add Food" onPress={() => router.push('/(tabs)/add-food')} />
            </View>
          ) : (
            <AppButton title="Save as food" loading={savingFood} onPress={handleSaveAsFood} />
          )}
        </View>
      ) : null}
    </Screen>
  )
}

function NutritionCard({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <View style={styles.nutritionCard}>
      <Text style={styles.nutritionLabel}>{label}</Text>
      <Text style={styles.nutritionValue}>{value}</Text>
      <Text style={styles.nutritionSuffix}>{suffix}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    marginBottom: 20
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.text
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
    marginBottom: 16
  },
  loadingRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 16
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 18
  },
  resultTop: {
    flexDirection: 'row',
    gap: 14
  },
  productImage: {
    width: 86,
    height: 86,
    borderRadius: 18,
    backgroundColor: '#F1F5F9'
  },
  productImageFallback: {
    width: 86,
    height: 86,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  productImageFallbackText: {
    fontSize: 34
  },
  resultMain: {
    flex: 1,
    gap: 4
  },
  resultLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  productName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900'
  },
  productMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  nutritionCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14
  },
  nutritionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  nutritionValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6
  },
  nutritionSuffix: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  notFoundCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: 16,
    gap: 6
  },
  notFoundTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  notFoundText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  warningCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    gap: 4
  },
  warningTitle: {
    color: '#92400E',
    fontSize: 15,
    fontWeight: '900'
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
    lineHeight: 20
  },
  savedCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 14,
    gap: 10
  },
  savedTitle: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '900'
  },
  savedText: {
    color: colors.primaryDark,
    fontSize: 14,
    lineHeight: 20
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    marginBottom: 16,
    gap: 4
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '800'
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20
  }
})
