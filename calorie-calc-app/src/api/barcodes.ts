import { apiClient } from '@/api/client'
import type { BarcodeLookup } from '@/types/barcodes'
import type { Food } from '@/types/foods'

export function lookupBarcode(barcode: string, forceRefresh = false) {
  const query = forceRefresh ? '?force_refresh=1' : ''

  return apiClient.get<{
    barcode_lookup: BarcodeLookup
  }>(`/barcodes/${encodeURIComponent(barcode)}${query}`)
}

export function saveBarcodeAsFood(barcode: string) {
  return apiClient.post<{
    food: Food
  }>(`/barcodes/${encodeURIComponent(barcode)}/save-as-food`)
}
