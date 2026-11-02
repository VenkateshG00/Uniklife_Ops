-- ============================================================
-- UnikScan Event Operations OS — Initial Schema
-- Migration: 001_initial_schema.sql
-- Run via: supabase db push  OR  psql < this file
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
  'super_admin', 'event_manager', 'office_staff',
  'onsite_staff', 'procurement_staff', 'read_only'
);

CREATE TYPE item_status AS ENUM (
  'not_started', 'in_progress', 'prepared', 'packed',
  'dispatched', 'delivered', 'venue_verified', 'completed',
  'blocked', 'shortage', 'damaged', 'cancelled', 'not_applicable'
);

CREATE TYPE task_status AS ENUM (
  'pending', 'in_progress', 'completed', 'overdue', 'blocked', 'cancelled'
);

CREATE TYPE priority_level AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TYPE event_phase AS ENUM (
  'planning', 'preparation', 'dispatch', 'event_day', 'post_event', 'closed'
);

CREATE TYPE shortage_status AS ENUM (
  'pending', 'under_review', 'approved', 'rejected',
  'procurement_assigned', 'dispatched', 'received', 'resolved'
);

CREATE TYPE item_type AS ENUM ('consumable', 'reusable');

-- ──────────────────────────────────────────────
-- ORGANIZATIONS
-- ──────────────────────────────────────────────

CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  settings    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ──────────────────────────────────────────────

CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  full_name       TEXT NOT NULL,
  phone           TEXT,
  role            user_role NOT NULL DEFAULT 'onsite_staff',
  avatar_url      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ──────────────────────────────────────────────
-- EVENTS
-- ──────────────────────────────────────────────

CREATE TABLE events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id),
  title                 TEXT NOT NULL,
  category              TEXT NOT NULL DEFAULT 'general',
  description           TEXT,
  venue_name            TEXT NOT NULL,
  venue_address         TEXT,
  location_link         TEXT,
  start_datetime        TIMESTAMPTZ NOT NULL,
  end_datetime          TIMESTAMPTZ NOT NULL,
  expected_attendees    INT NOT NULL DEFAULT 0,
  event_manager_id      UUID REFERENCES profiles(id),
  office_coordinator_id UUID REFERENCES profiles(id),
  status                TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','published','active','completed','cancelled')),
  phase                 event_phase NOT NULL DEFAULT 'planning',
  created_by            UUID NOT NULL REFERENCES profiles(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_org_start ON events(organization_id, start_datetime);
CREATE INDEX idx_events_manager ON events(event_manager_id);

-- ──────────────────────────────────────────────
-- EVENT OPERATION PLANS
-- ──────────────────────────────────────────────

CREATE TABLE event_operation_plans (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id              UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organization_id       UUID NOT NULL REFERENCES organizations(id),
  reporting_time        TIMESTAMPTZ,
  setup_deadline        TIMESTAMPTZ,
  dispatch_deadline     TIMESTAMPTZ,
  budget                NUMERIC(12,2),
  instructions          TEXT,
  overall_readiness_pct SMALLINT NOT NULL DEFAULT 0 CHECK (overall_readiness_pct BETWEEN 0 AND 100),
  phase                 event_phase NOT NULL DEFAULT 'planning',
  manager_approved_at   TIMESTAMPTZ,
  manager_approved_by   UUID REFERENCES profiles(id),
  created_by            UUID NOT NULL REFERENCES profiles(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id) -- one plan per event
);

-- ──────────────────────────────────────────────
-- MATERIAL CATEGORIES
-- ──────────────────────────────────────────────

CREATE TABLE material_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name            TEXT NOT NULL,
  icon            TEXT,
  color           TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  is_system       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed system categories
INSERT INTO material_categories (name, icon, sort_order, is_system) VALUES
  ('Participant Materials', 'users',      1,  TRUE),
  ('Stage & Technical',     'zap',        2,  TRUE),
  ('Venue Setup',           'layout',     3,  TRUE),
  ('Hospitality',           'coffee',     4,  TRUE),
  ('Operations',            'settings',   5,  TRUE),
  ('Branding',              'flag',       6,  TRUE);

-- ──────────────────────────────────────────────
-- MATERIAL CATALOG
-- ──────────────────────────────────────────────

CREATE TABLE material_catalog (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  category_id     UUID NOT NULL REFERENCES material_categories(id),
  name            TEXT NOT NULL,
  description     TEXT,
  unit            TEXT NOT NULL DEFAULT 'nos',
  item_type       item_type NOT NULL DEFAULT 'consumable',
  sku             TEXT,
  default_quantity INT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- EVENT CHECKLIST ITEMS
-- ──────────────────────────────────────────────

CREATE TABLE event_checklist_items (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_plan_id       UUID NOT NULL REFERENCES event_operation_plans(id) ON DELETE CASCADE,
  event_id                UUID NOT NULL REFERENCES events(id),
  organization_id         UUID NOT NULL REFERENCES organizations(id),
  catalog_item_id         UUID REFERENCES material_catalog(id),
  category_id             UUID NOT NULL REFERENCES material_categories(id),
  name                    TEXT NOT NULL,
  unit                    TEXT NOT NULL DEFAULT 'nos',
  item_type               item_type NOT NULL DEFAULT 'consumable',
  priority                priority_level NOT NULL DEFAULT 'medium',
  is_critical             BOOLEAN NOT NULL DEFAULT FALSE,

  -- Quantities (all non-negative)
  required_qty            INT NOT NULL DEFAULT 0 CHECK (required_qty >= 0),
  reserved_qty            INT NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),
  packed_qty              INT NOT NULL DEFAULT 0 CHECK (packed_qty >= 0),
  dispatched_qty          INT NOT NULL DEFAULT 0 CHECK (dispatched_qty >= 0),
  received_qty            INT NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
  venue_verified_qty      INT NOT NULL DEFAULT 0 CHECK (venue_verified_qty >= 0),
  additional_requested_qty INT NOT NULL DEFAULT 0 CHECK (additional_requested_qty >= 0),
  additional_approved_qty INT NOT NULL DEFAULT 0 CHECK (additional_approved_qty >= 0),
  damaged_qty             INT NOT NULL DEFAULT 0 CHECK (damaged_qty >= 0),
  lost_qty                INT NOT NULL DEFAULT 0 CHECK (lost_qty >= 0),

  -- Assignment
  responsible_staff_id    UUID REFERENCES profiles(id),
  due_time                TIMESTAMPTZ,

  -- State
  status                  item_status NOT NULL DEFAULT 'not_started',
  office_status           TEXT NOT NULL DEFAULT 'not_started'
                            CHECK (office_status IN ('not_started','in_progress','packed','dispatched')),
  venue_status            TEXT NOT NULL DEFAULT 'not_received'
                            CHECK (venue_status IN ('not_received','partially_received','received','verified')),

  -- Meta
  notes                   TEXT,
  photo_urls              TEXT[] NOT NULL DEFAULT '{}',
  last_updated_by         UUID REFERENCES profiles(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checklist_plan ON event_checklist_items(operation_plan_id);
CREATE INDEX idx_checklist_event ON event_checklist_items(event_id);

-- ──────────────────────────────────────────────
-- EVENT STAFF ASSIGNMENTS
-- ──────────────────────────────────────────────

CREATE TABLE event_staff_assignments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_plan_id UUID NOT NULL REFERENCES event_operation_plans(id) ON DELETE CASCADE,
  event_id          UUID NOT NULL REFERENCES events(id),
  staff_id          UUID NOT NULL REFERENCES profiles(id),
  role              TEXT NOT NULL
                      CHECK (role IN ('event_manager','office_coordinator','office_staff','onsite_staff','procurement_staff','event_assistant')),
  reporting_time    TIMESTAMPTZ,
  notes             TEXT,
  checked_in_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (operation_plan_id, staff_id)
);

-- ──────────────────────────────────────────────
-- EVENT TASKS
-- ──────────────────────────────────────────────

CREATE TABLE event_tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_plan_id   UUID NOT NULL REFERENCES event_operation_plans(id) ON DELETE CASCADE,
  event_id            UUID NOT NULL REFERENCES events(id),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  title               TEXT NOT NULL,
  description         TEXT,
  category            TEXT NOT NULL DEFAULT 'general',
  assigned_to_id      UUID REFERENCES profiles(id),
  created_by          UUID NOT NULL REFERENCES profiles(id),
  priority            priority_level NOT NULL DEFAULT 'medium',
  start_time          TIMESTAMPTZ,
  deadline            TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  status              task_status NOT NULL DEFAULT 'pending',
  escalation_state    TEXT NOT NULL DEFAULT 'none'
                        CHECK (escalation_state IN ('none','attention','escalated')),
  delay_reason        TEXT,
  revised_estimate    TIMESTAMPTZ,
  dependency_task_id  UUID REFERENCES event_tasks(id),
  proof_urls          TEXT[] NOT NULL DEFAULT '{}',
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_plan ON event_tasks(operation_plan_id);
CREATE INDEX idx_tasks_assigned ON event_tasks(assigned_to_id);

-- ──────────────────────────────────────────────
-- SHORTAGE REQUESTS
-- ──────────────────────────────────────────────

CREATE TABLE shortage_requests (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_plan_id         UUID NOT NULL REFERENCES event_operation_plans(id) ON DELETE CASCADE,
  event_id                  UUID NOT NULL REFERENCES events(id),
  organization_id           UUID NOT NULL REFERENCES organizations(id),
  checklist_item_id         UUID NOT NULL REFERENCES event_checklist_items(id),
  requested_by              UUID NOT NULL REFERENCES profiles(id),
  current_qty               INT NOT NULL DEFAULT 0,
  additional_qty_requested  INT NOT NULL CHECK (additional_qty_requested > 0),
  reason                    TEXT NOT NULL,
  priority                  priority_level NOT NULL DEFAULT 'high',
  needed_by                 TIMESTAMPTZ,
  notes                     TEXT,
  attachment_urls           TEXT[] NOT NULL DEFAULT '{}',
  status                    shortage_status NOT NULL DEFAULT 'pending',
  reviewed_by               UUID REFERENCES profiles(id),
  reviewed_at               TIMESTAMPTZ,
  review_notes              TEXT,
  approved_qty              INT,
  assigned_procurement_id   UUID REFERENCES profiles(id),
  resolved_at               TIMESTAMPTZ,
  resolved_by               UUID REFERENCES profiles(id),
  resolution_notes          TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shortage_plan ON shortage_requests(operation_plan_id);
CREATE INDEX idx_shortage_status ON shortage_requests(status);

-- ──────────────────────────────────────────────
-- SHORTAGE REQUEST ACTIONS (immutable audit)
-- ──────────────────────────────────────────────

CREATE TABLE shortage_request_actions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shortage_request_id UUID NOT NULL REFERENCES shortage_requests(id) ON DELETE CASCADE,
  action_by           UUID NOT NULL REFERENCES profiles(id),
  action_type         TEXT NOT NULL
                        CHECK (action_type IN ('submitted','approved','rejected','clarification_requested','procurement_assigned','dispatched','received','resolved')),
  notes               TEXT,
  qty_change          INT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- INVENTORY CATALOG
-- ──────────────────────────────────────────────

CREATE TABLE inventory_catalog (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  category_id     UUID NOT NULL REFERENCES material_categories(id),
  name            TEXT NOT NULL,
  sku             TEXT,
  description     TEXT,
  unit            TEXT NOT NULL DEFAULT 'unit',
  item_type       item_type NOT NULL DEFAULT 'reusable',
  storage_location TEXT,
  current_stock   INT NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  reserved_stock  INT NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  minimum_stock   INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- INVENTORY STOCK MOVEMENTS
-- ──────────────────────────────────────────────

CREATE TABLE inventory_stock_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_catalog(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  event_id        UUID REFERENCES events(id),
  movement_type   TEXT NOT NULL
                    CHECK (movement_type IN ('receipt','issue','return','adjustment','damage','loss')),
  quantity        INT NOT NULL,
  reference_id    UUID,
  notes           TEXT,
  performed_by    UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- EVENT ACTIVITY LOG (immutable audit trail)
-- ──────────────────────────────────────────────

CREATE TABLE event_activity_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID NOT NULL REFERENCES events(id),
  operation_plan_id   UUID REFERENCES event_operation_plans(id),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  actor_id            UUID NOT NULL REFERENCES profiles(id),
  actor_name          TEXT NOT NULL,
  action              TEXT NOT NULL,
  entity_type         TEXT NOT NULL,
  entity_id           UUID,
  entity_name         TEXT,
  old_value           JSONB,
  new_value           JSONB,
  meta                JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_event ON event_activity_log(event_id, created_at DESC);
CREATE INDEX idx_activity_plan ON event_activity_log(operation_plan_id, created_at DESC);

-- ──────────────────────────────────────────────
-- OPERATION TEMPLATES
-- ──────────────────────────────────────────────

CREATE TABLE operation_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name            TEXT NOT NULL,
  event_category  TEXT NOT NULL,
  description     TEXT,
  template_data   JSONB NOT NULL DEFAULT '{}',
  is_system       BOOLEAN NOT NULL DEFAULT FALSE,
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────────

ALTER TABLE organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_operation_plans  ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_checklist_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortage_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortage_request_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_activity_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_catalog      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_catalog       ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_templates    ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all in their org, edit own
CREATE POLICY "org_members_read_profiles" ON profiles
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR id = auth.uid()
  );

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Events: org isolation
CREATE POLICY "org_members_read_events" ON events
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "managers_write_events" ON events
  FOR ALL USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin','event_manager')
  );

-- Checklist items: all org members read, staff write their assigned items
CREATE POLICY "org_read_checklist" ON event_checklist_items
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "staff_write_checklist" ON event_checklist_items
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin','event_manager','office_staff','onsite_staff')
  );

-- Shortage requests: org read, staff can insert, managers can update
CREATE POLICY "org_read_shortages" ON shortage_requests
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "staff_create_shortage" ON shortage_requests
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND requested_by = auth.uid()
  );

CREATE POLICY "managers_update_shortage" ON shortage_requests
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin','event_manager')
  );

-- Activity log: read only for org members
CREATE POLICY "org_read_activity" ON event_activity_log
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- System categories: public read
CREATE POLICY "anyone_read_system_categories" ON material_categories
  FOR SELECT USING (is_system = TRUE OR organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- ──────────────────────────────────────────────
-- HELPER FUNCTION: log activity
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION log_event_activity(
  p_event_id        UUID,
  p_plan_id         UUID,
  p_org_id          UUID,
  p_actor_id        UUID,
  p_actor_name      TEXT,
  p_action          TEXT,
  p_entity_type     TEXT,
  p_entity_id       UUID DEFAULT NULL,
  p_entity_name     TEXT DEFAULT NULL,
  p_old_value       JSONB DEFAULT NULL,
  p_new_value       JSONB DEFAULT NULL,
  p_meta            JSONB DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO event_activity_log (
    event_id, operation_plan_id, organization_id,
    actor_id, actor_name, action, entity_type,
    entity_id, entity_name, old_value, new_value, meta
  ) VALUES (
    p_event_id, p_plan_id, p_org_id,
    p_actor_id, p_actor_name, p_action, p_entity_type,
    p_entity_id, p_entity_name, p_old_value, p_new_value, p_meta
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ──────────────────────────────────────────────
-- READINESS CALCULATION VIEW
-- ──────────────────────────────────────────────

CREATE OR REPLACE VIEW event_readiness_summary AS
SELECT
  e.id                                              AS event_id,
  p.id                                              AS plan_id,
  COUNT(c.id)                                       AS total_items,
  COUNT(*) FILTER (WHERE c.status IN ('completed','venue_verified'))   AS completed,
  COUNT(*) FILTER (WHERE c.status = 'in_progress')  AS in_progress,
  COUNT(*) FILTER (WHERE c.status = 'not_started')  AS pending,
  COUNT(*) FILTER (WHERE c.status = 'blocked')      AS blocked,
  COUNT(*) FILTER (WHERE c.status = 'shortage')     AS shortage_items,
  COUNT(*) FILTER (WHERE c.is_critical)             AS critical_total,
  COUNT(*) FILTER (WHERE c.is_critical AND c.status IN ('completed','venue_verified')) AS critical_verified,
  COALESCE(
    ROUND(
      COUNT(*) FILTER (WHERE c.status IN ('completed','venue_verified')) * 100.0
      / NULLIF(COUNT(c.id), 0)
    )
  , 0)::SMALLINT                                     AS readiness_pct
FROM events e
LEFT JOIN event_operation_plans p ON p.event_id = e.id
LEFT JOIN event_checklist_items c ON c.operation_plan_id = p.id
GROUP BY e.id, p.id;
