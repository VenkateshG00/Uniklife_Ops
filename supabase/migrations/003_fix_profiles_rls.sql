-- Remove FORCE ROW LEVEL SECURITY — postgres (trigger owner) bypasses RLS by default
-- FORCE was incorrectly added in 002 and broke the auth trigger
ALTER TABLE profiles NO FORCE ROW LEVEL SECURITY;

-- Drop the overly-broad insert policy added in 002 (not needed now)
DROP POLICY IF EXISTS "trigger_insert_profile" ON profiles;
