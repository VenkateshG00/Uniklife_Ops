-- ============================================================
-- Migration 005: Fix infinite RLS recursion on profiles table
--
-- Root cause: every policy used a subquery like
--   (SELECT organization_id FROM profiles WHERE id = auth.uid())
-- When PostgreSQL evaluates RLS on profiles itself it triggers
-- the same subquery → infinite recursion.
--
-- Fix: two SECURITY DEFINER functions that read profiles
-- bypassing RLS (they run as the table owner, not the user),
-- then rebuild every policy using those functions.
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. Helper functions (bypass RLS on profiles)
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_auth_org_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid()
$$;

-- ──────────────────────────────────────────────
-- 2. profiles — fix the recursive policy
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "org_members_read_profiles"  ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile"   ON profiles;
DROP POLICY IF EXISTS "trigger_insert_profile"     ON profiles;

-- Any user can always read their own row; org members can read each other
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR organization_id = get_auth_org_id()
  );

-- Users can update only their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow inserts (used by the auth trigger and service role)
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (true);

-- ──────────────────────────────────────────────
-- 3. events
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "org_members_read_events" ON events;
DROP POLICY IF EXISTS "managers_write_events"   ON events;

CREATE POLICY "events_select" ON events
  FOR SELECT USING (organization_id = get_auth_org_id());

CREATE POLICY "events_insert" ON events
  FOR INSERT WITH CHECK (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager')
  );

CREATE POLICY "events_update" ON events
  FOR UPDATE USING (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager')
  )
  WITH CHECK (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager')
  );

CREATE POLICY "events_delete" ON events
  FOR DELETE USING (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager')
  );

-- ──────────────────────────────────────────────
-- 4. event_operation_plans (no policy existed before)
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "org_read_plans"       ON event_operation_plans;
DROP POLICY IF EXISTS "managers_write_plans" ON event_operation_plans;

CREATE POLICY "plans_select" ON event_operation_plans
  FOR SELECT USING (organization_id = get_auth_org_id());

CREATE POLICY "plans_insert" ON event_operation_plans
  FOR INSERT WITH CHECK (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager')
  );

CREATE POLICY "plans_update" ON event_operation_plans
  FOR UPDATE USING (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager')
  )
  WITH CHECK (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager')
  );

-- ──────────────────────────────────────────────
-- 5. event_checklist_items
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "org_read_checklist"   ON event_checklist_items;
DROP POLICY IF EXISTS "staff_write_checklist" ON event_checklist_items;

CREATE POLICY "checklist_select" ON event_checklist_items
  FOR SELECT USING (organization_id = get_auth_org_id());

CREATE POLICY "checklist_insert" ON event_checklist_items
  FOR INSERT WITH CHECK (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager','office_staff','onsite_staff')
  );

CREATE POLICY "checklist_update" ON event_checklist_items
  FOR UPDATE USING (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager','office_staff','onsite_staff')
  )
  WITH CHECK (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager','office_staff','onsite_staff')
  );

-- ──────────────────────────────────────────────
-- 6. shortage_requests
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "org_read_shortages"      ON shortage_requests;
DROP POLICY IF EXISTS "staff_create_shortage"   ON shortage_requests;
DROP POLICY IF EXISTS "managers_update_shortage" ON shortage_requests;

CREATE POLICY "shortages_select" ON shortage_requests
  FOR SELECT USING (organization_id = get_auth_org_id());

CREATE POLICY "shortages_insert" ON shortage_requests
  FOR INSERT WITH CHECK (
    organization_id = get_auth_org_id()
    AND requested_by = auth.uid()
  );

CREATE POLICY "shortages_update" ON shortage_requests
  FOR UPDATE USING (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager')
  )
  WITH CHECK (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager')
  );

-- ──────────────────────────────────────────────
-- 7. event_activity_log
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "org_read_activity" ON event_activity_log;

CREATE POLICY "activity_select" ON event_activity_log
  FOR SELECT USING (organization_id = get_auth_org_id());

CREATE POLICY "activity_insert" ON event_activity_log
  FOR INSERT WITH CHECK (organization_id = get_auth_org_id());

-- ──────────────────────────────────────────────
-- 8. material_categories
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "anyone_read_system_categories" ON material_categories;

CREATE POLICY "categories_select" ON material_categories
  FOR SELECT USING (
    is_system = TRUE
    OR organization_id = get_auth_org_id()
  );

-- ──────────────────────────────────────────────
-- 9. organizations — allow members to read their own
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "org_members_read_org" ON organizations;

CREATE POLICY "orgs_select" ON organizations
  FOR SELECT USING (
    id = get_auth_org_id()
  );
