// ============================================================================
// EcoTrack — AI-Style Insights Engine (Rule-Based, No External API)
// ============================================================================
// This module analyzes a user's logged data to generate personalized insights.
// It identifies the single highest-impact category and produces a specific,
// actionable tip with a quantified CO2 reduction estimate.
//
// The "AI" here is a transparent rule-based system — easy to explain in a
// hackathon submission and requiring no external API or model.
// ============================================================================

import { EMISSION_FACTORS, type DailyLogData, type FootprintBreakdown } from './co2';

export type InsightCategory = 'transport' | 'food' | 'energy';

export interface Insight {
  category: InsightCategory;
  categoryLabel: string;
  headline: string;
  tip: string;
  potentialReductionKg: number;
  potentialReductionPct: number;
}

// ---------------------------------------------------------------------------
// Analyze 7 days of logs and return the single highest-impact insight.
// ---------------------------------------------------------------------------
export function generateInsight(
  logs: DailyLogData[],
  breakdown: FootprintBreakdown,
): Insight | null {
  if (logs.length === 0) return null;

  // Average the last 7 days to find the dominant category
  const avgTransport = breakdown.transport;
  const avgFood = breakdown.food;
  const avgEnergy = breakdown.energy;

  // Find the highest category
  const categories: { key: InsightCategory; value: number; label: string }[] = [
    { key: 'transport', value: avgTransport, label: 'Transport' },
    { key: 'food', value: avgFood, label: 'Food' },
    { key: 'energy', value: avgEnergy, label: 'Energy' },
  ];
  categories.sort((a, b) => b.value - a.value);
  const top = categories[0];

  // Generate a specific tip for the top category
  const tip = buildTip(top.key, logs, breakdown.total);
  return tip;
}

// ---------------------------------------------------------------------------
// Build a specific, quantified tip for the given category
// ---------------------------------------------------------------------------
function buildTip(
  category: InsightCategory,
  logs: DailyLogData[],
  totalDailyKg: number,
): Insight {
  // Average daily values across the logged days
  const n = logs.length || 1;
  const avgCar = logs.reduce((s, l) => s + l.car_km, 0) / n;
  const avgMeat = logs.reduce((s, l) => s + l.meat_heavy_meals, 0) / n;
  const avgAC = logs.reduce((s, l) => s + l.ac_hours, 0) / n;

  if (category === 'transport') {
    // Tip: replace 2 car trips/week with biking
    // Assume average car trip ~5 km. 2 trips × 5 km × 0.192 kg/km = weekly saving.
    // Convert to daily equivalent for the percentage.
    const carTripsPerWeek = 2;
    const avgTripKm = avgCar > 0 ? Math.min(avgCar, 5) : 5;
    const weeklyReductionKg = carTripsPerWeek * avgTripKm * EMISSION_FACTORS.car;
    const dailyReductionKg = weeklyReductionKg / 7;
    const pct = totalDailyKg > 0 ? (dailyReductionKg / totalDailyKg) * 100 : 0;

    return {
      category: 'transport',
      categoryLabel: 'Transport',
      headline: 'Your transport emissions are your biggest factor',
      tip: `Switching ${carTripsPerWeek} car trips/week to biking could cut your footprint by ${pct.toFixed(0)}% (~${dailyReductionKg.toFixed(1)} kg CO₂/day).`,
      potentialReductionKg: dailyReductionKg,
      potentialReductionPct: pct,
    };
  }

  if (category === 'food') {
    // Tip: replace meat-heavy meals with vegetarian
    const mealsToSwap = Math.max(1, Math.round(avgMeat));
    const dailyReductionKg = mealsToSwap * (EMISSION_FACTORS.meat_heavy - EMISSION_FACTORS.vegetarian);
    const pct = totalDailyKg > 0 ? (dailyReductionKg / totalDailyKg) * 100 : 0;

    return {
      category: 'food',
      categoryLabel: 'Food',
      headline: 'Your food choices are your biggest factor',
      tip: `Swapping ${mealsToSwap} meat-heavy meal${mealsToSwap > 1 ? 's' : ''}/day for vegetarian could cut your footprint by ${pct.toFixed(0)}% (~${dailyReductionKg.toFixed(1)} kg CO₂/day).`,
      potentialReductionKg: dailyReductionKg,
      potentialReductionPct: pct,
    };
  }

  // Energy
  const hoursToReduce = Math.max(1, Math.round(avgAC * 0.3));
  const dailyReductionKg = hoursToReduce * EMISSION_FACTORS.ac_heating;
  const pct = totalDailyKg > 0 ? (dailyReductionKg / totalDailyKg) * 100 : 0;

  return {
    category: 'energy',
    categoryLabel: 'Energy',
    headline: 'Your home energy use is your biggest factor',
    tip: `Reducing AC/heating by ${hoursToReduce} hour${hoursToReduce > 1 ? 's' : ''}/day could cut your footprint by ${pct.toFixed(0)}% (~${dailyReductionKg.toFixed(1)} kg CO₂/day).`,
    potentialReductionKg: dailyReductionKg,
    potentialReductionPct: pct,
  };
}

// ---------------------------------------------------------------------------
// Streak counter: consecutive days where total < personal goal
// ---------------------------------------------------------------------------
export function calculateStreak(
  dailyTotals: { log_date: string; total_kg: number }[],
  goalKg: number,
): number {
  if (dailyTotals.length === 0) return 0;

  // Sort descending by date (most recent first)
  const sorted = [...dailyTotals].sort((a, b) =>
    b.log_date.localeCompare(a.log_date),
  );

  let streak = 0;
  for (const day of sorted) {
    if (day.total_kg < goalKg) {
      streak++;
    } else {
      break; // streak broken
    }
  }
  return streak;
}
