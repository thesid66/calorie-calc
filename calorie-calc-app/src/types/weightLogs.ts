export type WeightLog = {
  id: number
  logged_on: string
  weight_kg: number
  notes: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type WeightLogsResponse = {
  from: string
  to: string
  weight_logs: WeightLog[]
}

export type StoreWeightLogPayload = {
  logged_on: string
  weight_kg: number
  notes?: string | null
}

export type UpdateWeightLogPayload = StoreWeightLogPayload
