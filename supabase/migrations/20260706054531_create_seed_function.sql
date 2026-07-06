/*
# EcoTrack — Seed Sample Data Function

## Purpose
Provides a database function `seed_sample_data()` that inserts 7 days of realistic
sample daily_logs and wellbeing_logs for the calling authenticated user. This is
called from the frontend after signup/onboarding so charts are populated immediately.

## How it works
1. Generates 7 days of data ending today (most recent = today).
2. Each day has varied transport, food, and energy values to create a realistic
   trend (some days better, some worse).
3. Computes total_kg for each day using the same emission factors used in the
   frontend (kept in sync here for DB-side accuracy).
4. Also inserts wellbeing_logs for each day with varied energy levels and outdoor
   time to show the health correlation.
5. Uses ON CONFLICT to be idempotent — re-running won't duplicate or overwrite
   existing user logs.

## Security
- SECURITY DEFINER is NOT used; the function runs as the caller, so RLS applies.
- Only inserts rows where user_id = auth.uid().

## Emission factors (kg CO2 per unit) — must match frontend constants
- Car:   0.192 kg/km   (petrol car average)
- Bus:   0.089 kg/km   (public bus)
- Bike:  0.000 kg/km   (zero direct emissions)
- Walk:  0.000 kg/km
- Flight: 0.255 kg/km  (short-haul economy per passenger)
- Meat-heavy meal: 3.30 kg/meal
- Mixed meal:       1.80 kg/meal
- Vegetarian meal:  1.20 kg/meal
- Vegan meal:       0.70 kg/meal
- AC/heating:       0.40 kg/hour
- Appliance:        0.45 kg/kWh
*/

CREATE OR REPLACE FUNCTION seed_sample_data()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  d int;
  log_date date;
  car_km numeric;
  bus_km numeric;
  bike_km numeric;
  walk_km numeric;
  meat_meals int;
  mixed_meals int;
  veg_meals int;
  vegan_meals int;
  ac_hrs numeric;
  app_kwh numeric;
  total numeric;
  energy_lvl int;
  outdoor_min int;
BEGIN
  FOR d IN 0..6 LOOP
    log_date := (current_date - (6 - d));

    -- Vary the sample data day-by-day to create a realistic downward trend
    car_km   := CASE WHEN d % 3 = 0 THEN 12 WHEN d % 3 = 1 THEN 8 ELSE 18 END;
    bus_km   := CASE WHEN d % 2 = 0 THEN 5 ELSE 0 END;
    bike_km  := CASE WHEN d % 3 = 2 THEN 6 ELSE 2 END;
    walk_km  := CASE WHEN d % 2 = 0 THEN 3 ELSE 1.5 END;

    meat_meals   := CASE WHEN d < 3 THEN 1 ELSE 0 END;
    mixed_meals  := CASE WHEN d % 2 = 0 THEN 1 ELSE 2 END;
    veg_meals    := CASE WHEN d >= 3 THEN 1 ELSE 0 END;
    vegan_meals  := CASE WHEN d % 4 = 3 THEN 1 ELSE 0 END;

    ac_hrs  := CASE WHEN d % 2 = 0 THEN 3 ELSE 1.5 END;
    app_kwh := 2.5 + (d % 3);

    -- Compute total CO2 using the same emission factors as the frontend
    total :=
      car_km   * 0.192 +
      bus_km   * 0.089 +
      bike_km  * 0.000 +
      walk_km  * 0.000 +
      0.000 +  -- flight not included in sample data
      meat_meals   * 3.30 +
      mixed_meals  * 1.80 +
      veg_meals    * 1.20 +
      vegan_meals  * 0.70 +
      ac_hrs  * 0.40 +
      app_kwh * 0.45;

    -- Insert daily log (idempotent via ON CONFLICT)
    INSERT INTO daily_logs (user_id, log_date, car_km, bus_km, bike_km, walk_km, flight_km,
                            meat_heavy_meals, mixed_meals, vegetarian_meals, vegan_meals,
                            ac_hours, appliance_kwh, total_kg)
    VALUES (auth.uid(), log_date, car_km, bus_km, bike_km, walk_km, 0,
            meat_meals, mixed_meals, veg_meals, vegan_meals,
            ac_hrs, app_kwh, total)
    ON CONFLICT (user_id, log_date) DO NOTHING;

    -- Wellbeing data: energy and outdoor time correlate with active transport
    energy_lvl  := CASE WHEN bike_km + walk_km > 5 THEN 4 WHEN d < 2 THEN 2 ELSE 3 END;
    outdoor_min := (bike_km * 10 + walk_km * 12)::int;

    INSERT INTO wellbeing_logs (user_id, log_date, energy_level, outdoor_minutes, mood)
    VALUES (auth.uid(), log_date, energy_lvl, outdoor_min,
            CASE WHEN energy_lvl >= 4 THEN 'Great' WHEN energy_lvl <= 2 THEN 'Tired' ELSE 'Okay' END)
    ON CONFLICT (user_id, log_date) DO NOTHING;
  END LOOP;
END;
$$;
