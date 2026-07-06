/*
# EcoTrack — Update seed_sample_data to accept date range

## Purpose
The original seed_sample_data() used `current_date` (DB server timezone) to
generate 7 days of sample data. The frontend uses the client's local date
(new Date() formatted as YYYY-MM-DD). If the DB server and client are in
different timezones, the seeded dates won't match the client's "today",
causing the weekly chart and today's log to appear empty.

## Changes
- Add optional `p_end_date` parameter (text, YYYY-MM-DD format).
- If provided, use it as the end date instead of `current_date`.
- If NULL, fall back to `current_date` for backward compatibility.
- The function now generates 7 days ending on the provided date.

## Security
- No security changes. Function still runs as the caller (RLS applies).
*/

CREATE OR REPLACE FUNCTION seed_sample_data(p_end_date text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  d int;
  end_date date;
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
  -- Use provided date or fall back to server current_date
  end_date := COALESCE(p_end_date::date, current_date);

  FOR d IN 0..6 LOOP
    log_date := end_date - (6 - d);

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
