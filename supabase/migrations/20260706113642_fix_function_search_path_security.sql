/*
# Fix: Set immutable search_path on database functions

## Purpose
Security hardening — both `update_updated_at()` and `seed_sample_data()` had
role-mutable search paths, which allows a search path hijacking attack where
a malicious function in another schema could shadow built-in calls.

## Changes
- ALTER both functions to SET search_path = public, pg_temp
- This locks the search path so only the `public` schema (and temp schema)
  are searched, preventing hijacking.
- No logic changes — function bodies remain identical.
*/

ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.seed_sample_data(p_end_date text) SET search_path = public, pg_temp;
