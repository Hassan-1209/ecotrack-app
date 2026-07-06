// ============================================================================
// EcoTrack — Database Types
// ============================================================================

export interface Profile {
  id: string;
  daily_goal_kg: number;
  typical_car_km: number;
  typical_bus_km: number;
  typical_bike_km: number;
  typical_walk_km: number;
  typical_diet: string;
  typical_ac_hours: number;
  onboarded: boolean;
  created_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  car_km: number;
  bus_km: number;
  bike_km: number;
  walk_km: number;
  flight_km: number;
  meat_heavy_meals: number;
  mixed_meals: number;
  vegetarian_meals: number;
  vegan_meals: number;
  ac_hours: number;
  appliance_kwh: number;
  total_kg: number;
  created_at: string;
  updated_at: string;
}

export interface WellbeingLog {
  id: string;
  user_id: string;
  log_date: string;
  energy_level: number;
  outdoor_minutes: number;
  mood: string | null;
  created_at: string;
}

export type DietType = 'meat_heavy' | 'mixed' | 'vegetarian' | 'vegan';
