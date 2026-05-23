export type SexForFormula = 'male' | 'female'

export type UnitSystem = 'metric' | 'imperial'

export type ActivityLevel = {
  id: number
  name: string
  slug?: string
  description?: string | null
  multiplier: number | string
}

export type UserProfile = {
  id: number
  user_id: number

  unit_system: UnitSystem
  sex_for_formula: SexForFormula

  date_of_birth: string
  height_cm: number

  starting_weight_kg: number
  current_weight_kg: number
  target_weight_kg: number

  activity_level_id?: number | null
  activity_level?: ActivityLevel | null

  created_at?: string
  updated_at?: string
}

export type UpdateProfilePayload = {
  unit_system: UnitSystem
  sex_for_formula: SexForFormula
  date_of_birth: string
  height_cm: number
  starting_weight_kg: number
  current_weight_kg: number
  target_weight_kg: number
  activity_level_id: number
}
