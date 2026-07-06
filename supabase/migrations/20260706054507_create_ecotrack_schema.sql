/*
# EcoTrack — Core Schema (profiles, daily_logs, wellbeing_logs)

## Purpose
EcoTrack is an AI-powered sustainability & health tracking app. Users log daily
transport, food, and energy activities; the app calculates their CO2 footprint,
generates rule-based insights, and optionally tracks wellbeing (energy level,
outdoor time) to connect sustainable habits with personal health.

## Tables

### 1. `profiles`
Stores per-user onboarding data and personal reduction goal.
- `id` (uuid, PK, FK → auth.users) — one row per user
- `daily_goal_kg` (numeric, default 16) — personal CO2 reduction target in kg/day
- `typical_car_km` (numeric) — average weekly car distance (onboarding)
- `typical_bus_km` (numeric) — average weekly bus distance (onboarding)
- `typical_bike_km` (numeric) — average weekly bike distance (onboarding)
- `typical_walk_km` (numeric) — average weekly walking distance (onboarding)
- `typical_diet` (text) — 'meat_heavy' | 'mixed' | 'vegetarian' | 'vegan'
- `typical_ac_hours` (numeric) — average daily AC/heating hours (onboarding)
- `onboarded` (boolean, default false) — whether onboarding is complete
- `created_at` (timestamptz)

### 2. `daily_logs`
One row per user per day. Stores transport, food, and energy activity data plus
the computed total CO2 footprint.
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users, DEFAULT auth.uid())
- `log_date` (date, NOT NULL) — the calendar day this log represents
- Transport: `car_km`, `bus_km`, `bike_km`, `walk_km`, `flight_km` (numeric)
- Food: `meat_heavy_meals`, `mixed_meals`, `vegetarian_meals`, `vegan_meals` (int)
- Energy: `ac_hours`, `appliance_kwh` (numeric)
- `total_kg` (numeric) — computed total CO2 in kg for the day
- `created_at`, `updated_at` (timestamptz)
- UNIQUE(user_id, log_date) — one log per day

### 3. `wellbeing_logs`
Optional daily wellbeing check-in (health tie-in).
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users, DEFAULT auth.uid())
- `log_date` (date, NOT NULL)
- `energy_level` (int, 1–5) — self-reported energy
- `outdoor_minutes` (int) — minutes spent outdoors
- `mood` (text, optional) — short mood note
- `created_at` (timestamptz)
- UNIQUE(user_id, log_date)

## Security (RLS)
All tables have RLS enabled with owner-scoped policies (TO authenticated).
`user_id` columns default to `auth.uid()` so inserts that omit `user_id` succeed.
Each table has 4 separate CRUD policies (select/insert/update/delete).

## Notes
1. Email/password auth only (Supabase built-in). Email confirmation stays OFF.
2. No destructive operations — schema is additive only.
3. Seed data is inserted in a separate migration to keep this idempotent.
*/

-- ============================================================================
-- profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_goal_kg numeric NOT NULL DEFAULT 16,
  typical_car_km numeric NOT NULL DEFAULT 0,
  typical_bus_km numeric NOT NULL DEFAULT 0,
  typical_bike_km numeric NOT NULL DEFAULT 0,
  typical_walk_km numeric NOT NULL DEFAULT 0,
  typical_diet text NOT NULL DEFAULT 'mixed',
  typical_ac_hours numeric NOT NULL DEFAULT 0,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ============================================================================
-- daily_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  car_km numeric NOT NULL DEFAULT 0,
  bus_km numeric NOT NULL DEFAULT 0,
  bike_km numeric NOT NULL DEFAULT 0,
  walk_km numeric NOT NULL DEFAULT 0,
  flight_km numeric NOT NULL DEFAULT 0,
  meat_heavy_meals int NOT NULL DEFAULT 0,
  mixed_meals int NOT NULL DEFAULT 0,
  vegetarian_meals int NOT NULL DEFAULT 0,
  vegan_meals int NOT NULL DEFAULT 0,
  ac_hours numeric NOT NULL DEFAULT 0,
  appliance_kwh numeric NOT NULL DEFAULT 0,
  total_kg numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date)
);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_daily_logs" ON daily_logs;
CREATE POLICY "select_own_daily_logs" ON daily_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_daily_logs" ON daily_logs;
CREATE POLICY "insert_own_daily_logs" ON daily_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_daily_logs" ON daily_logs;
CREATE POLICY "update_own_daily_logs" ON daily_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_daily_logs" ON daily_logs;
CREATE POLICY "delete_own_daily_logs" ON daily_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date DESC);

-- ============================================================================
-- wellbeing_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS wellbeing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  energy_level int NOT NULL DEFAULT 3 CHECK (energy_level >= 1 AND energy_level <= 5),
  outdoor_minutes int NOT NULL DEFAULT 0,
  mood text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date)
);

ALTER TABLE wellbeing_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wellbeing" ON wellbeing_logs;
CREATE POLICY "select_own_wellbeing" ON wellbeing_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_wellbeing" ON wellbeing_logs;
CREATE POLICY "insert_own_wellbeing" ON wellbeing_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_wellbeing" ON wellbeing_logs;
CREATE POLICY "update_own_wellbeing" ON wellbeing_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_wellbeing" ON wellbeing_logs;
CREATE POLICY "delete_own_wellbeing" ON wellbeing_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wellbeing_user_date ON wellbeing_logs(user_id, log_date DESC);

-- ============================================================================
-- updated_at trigger for daily_logs
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_daily_logs_updated ON daily_logs;
CREATE TRIGGER trg_daily_logs_updated
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
