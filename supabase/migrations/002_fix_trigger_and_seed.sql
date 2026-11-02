-- Fix: add INSERT policy on profiles so the auth trigger can fire
-- The trigger is SECURITY DEFINER but needs a policy for the service_role path
CREATE POLICY "service_role_manage_profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also allow the trigger (runs as postgres) to insert without restriction
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

CREATE POLICY "trigger_insert_profile"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Seed: UnikScan organization
INSERT INTO organizations (id, name, slug)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'UnikScan',
  'unikscan'
) ON CONFLICT (id) DO NOTHING;
