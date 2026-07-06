// ============================================================================
// EcoTrack — CO2 Emission Factors & Calculation Engine
// ============================================================================
// All emission factors are sourced from publicly available averages and are
// clearly commented so the methodology can be explained in a hackathon
// submission. No external API is used — all calculations are built-in logic.
//
// Sources (approximate global averages):
// - Transport: EPA, UK DEFRA, and EEA per-passenger-km figures
// - Food: Poore & Nemecek (2018) Science study on food footprints
// - Energy: US EPA eGRID average grid emission factor
// ============================================================================

// ---------------------------------------------------------------------------
// EMISSION FACTORS (kg CO2 per unit)
// ---------------------------------------------------------------------------
export const EMISSION_FACTORS = {
  // --- Transport (kg CO2 per km traveled) ---
  // Petrol car average: ~0.192 kg CO2/km (EPA average for light-duty vehicles)
  car: 0.192,
  // Public bus: ~0.089 kg CO2/passenger-km (EEA average, higher occupancy)
  bus: 0.089,
  // Bicycle: 0 kg CO2/km (zero direct emissions)
  bike: 0.0,
  // Walking: 0 kg CO2/km (zero direct emissions)
  walk: 0.0,
  // Short-haul flight: ~0.255 kg CO2/passenger-km (DEFRA, economy class)
  flight: 0.255,

  // --- Food (kg CO2 per meal) ---
  // Meat-heavy meal (beef/lamb heavy): ~3.30 kg CO2/meal
  meat_heavy: 3.3,
  // Mixed diet meal (some meat, e.g. chicken/pork): ~1.80 kg CO2/meal
  mixed: 1.8,
  // Vegetarian meal (dairy + plant-based): ~1.20 kg CO2/meal
  vegetarian: 1.2,
  // Vegan meal (fully plant-based): ~0.70 kg CO2/meal
  vegan: 0.7,

  // --- Energy (kg CO2 per unit) ---
  // Air conditioning / heating: ~0.40 kg CO2/hour (average home HVAC)
  ac_heating: 0.4,
  // General appliance electricity: ~0.45 kg CO2/kWh (US grid average)
  appliance: 0.45,
} as const;

// ---------------------------------------------------------------------------
// National average for comparison (kg CO2 per person per day)
// Source: Global Carbon Atlas / EPA — US average ~16 kg CO2/person/day
// (includes transport, food, and home energy; excludes industrial/shared)
// ---------------------------------------------------------------------------
export const NATIONAL_AVG_DAILY_KG = 16;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface DailyLogData {
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
}

export interface FootprintBreakdown {
  transport: number;
  food: number;
  energy: number;
  total: number;
}

// ---------------------------------------------------------------------------
// CALCULATION FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Calculate transport CO2 emissions.
 * Formula: sum of (distance_km × emission_factor) for each transport mode.
 *   car:   car_km × 0.192
 *   bus:   bus_km × 0.089
 *   bike:  bike_km × 0     (zero-emission)
 *   walk:  walk_km × 0     (zero-emission)
 *   flight: flight_km × 0.255
 */
export function calcTransportCO2(d: DailyLogData): number {
  return (
    d.car_km * EMISSION_FACTORS.car +
    d.bus_km * EMISSION_FACTORS.bus +
    d.bike_km * EMISSION_FACTORS.bike +
    d.walk_km * EMISSION_FACTORS.walk +
    d.flight_km * EMISSION_FACTORS.flight
  );
}

/**
 * Calculate food CO2 emissions.
 * Formula: sum of (meal_count × emission_factor) for each diet type.
 *   meat_heavy: meals × 3.30
 *   mixed:      meals × 1.80
 *   vegetarian: meals × 1.20
 *   vegan:      meals × 0.70
 */
export function calcFoodCO2(d: DailyLogData): number {
  return (
    d.meat_heavy_meals * EMISSION_FACTORS.meat_heavy +
    d.mixed_meals * EMISSION_FACTORS.mixed +
    d.vegetarian_meals * EMISSION_FACTORS.vegetarian +
    d.vegan_meals * EMISSION_FACTORS.vegan
  );
}

/**
 * Calculate energy CO2 emissions.
 * Formula:
 *   AC/heating: ac_hours × 0.40
 *   Appliances:  appliance_kwh × 0.45
 */
export function calcEnergyCO2(d: DailyLogData): number {
  return (
    d.ac_hours * EMISSION_FACTORS.ac_heating +
    d.appliance_kwh * EMISSION_FACTORS.appliance
  );
}

/**
 * Calculate the total daily CO2 footprint and per-category breakdown.
 * Total = transport + food + energy
 */
export function calcTotalCO2(d: DailyLogData): FootprintBreakdown {
  const transport = calcTransportCO2(d);
  const food = calcFoodCO2(d);
  const energy = calcEnergyCO2(d);
  return {
    transport,
    food,
    energy,
    total: transport + food + energy,
  };
}

/**
 * Format kg CO2 for display (1 decimal place).
 */
export function formatCO2(kg: number): string {
  return kg.toFixed(1);
}

/**
 * Calculate percentage difference vs national average.
 * Positive = above average (worse), negative = below average (better).
 */
export function vsNationalAverage(totalKg: number): number {
  return ((totalKg - NATIONAL_AVG_DAILY_KG) / NATIONAL_AVG_DAILY_KG) * 100;
}
