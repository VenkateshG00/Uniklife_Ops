-- ============================================================
-- Migration 006: RLS policies for tables missing them +
--                event_attendees and event_payments tables
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. event_tasks
-- ──────────────────────────────────────────────

CREATE POLICY "tasks_select" ON event_tasks
  FOR SELECT USING (organization_id = get_auth_org_id());

CREATE POLICY "tasks_insert" ON event_tasks
  FOR INSERT WITH CHECK (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager','office_staff','onsite_staff')
  );

CREATE POLICY "tasks_update" ON event_tasks
  FOR UPDATE USING (
    organization_id = get_auth_org_id()
    AND (
      assigned_to_id = auth.uid()
      OR get_auth_role() IN ('super_admin','event_manager')
    )
  )
  WITH CHECK (organization_id = get_auth_org_id());

CREATE POLICY "tasks_delete" ON event_tasks
  FOR DELETE USING (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager')
  );

-- ──────────────────────────────────────────────
-- 2. inventory_catalog
-- ──────────────────────────────────────────────

CREATE POLICY "inventory_select" ON inventory_catalog
  FOR SELECT USING (organization_id = get_auth_org_id());

CREATE POLICY "inventory_insert" ON inventory_catalog
  FOR INSERT WITH CHECK (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager','procurement_staff')
  );

CREATE POLICY "inventory_update" ON inventory_catalog
  FOR UPDATE USING (organization_id = get_auth_org_id())
  WITH CHECK (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager','procurement_staff')
  );

-- ──────────────────────────────────────────────
-- 3. inventory_stock_movements
-- ──────────────────────────────────────────────

CREATE POLICY "stock_movements_select" ON inventory_stock_movements
  FOR SELECT USING (organization_id = get_auth_org_id());

CREATE POLICY "stock_movements_insert" ON inventory_stock_movements
  FOR INSERT WITH CHECK (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager','procurement_staff','office_staff')
  );

-- ──────────────────────────────────────────────
-- 4. material_catalog
-- ──────────────────────────────────────────────

CREATE POLICY "material_catalog_select" ON material_catalog
  FOR SELECT USING (
    is_active = TRUE
    AND (organization_id IS NULL OR organization_id = get_auth_org_id())
  );

CREATE POLICY "material_catalog_insert" ON material_catalog
  FOR INSERT WITH CHECK (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager')
  );

-- ──────────────────────────────────────────────
-- 5. shortage_request_actions
-- ──────────────────────────────────────────────

ALTER TABLE shortage_request_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shortage_actions_select" ON shortage_request_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shortage_requests sr
      WHERE sr.id = shortage_request_id
        AND sr.organization_id = get_auth_org_id()
    )
  );

CREATE POLICY "shortage_actions_insert" ON shortage_request_actions
  FOR INSERT WITH CHECK (action_by = auth.uid());

-- ──────────────────────────────────────────────
-- 6. event_staff_assignments
-- ──────────────────────────────────────────────

ALTER TABLE event_staff_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_assignments_select" ON event_staff_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_operation_plans p
      WHERE p.id = operation_plan_id
        AND p.organization_id = get_auth_org_id()
    )
  );

CREATE POLICY "staff_assignments_write" ON event_staff_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM event_operation_plans p
      WHERE p.id = operation_plan_id
        AND p.organization_id = get_auth_org_id()
    )
    AND get_auth_role() IN ('super_admin','event_manager')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_operation_plans p
      WHERE p.id = operation_plan_id
        AND p.organization_id = get_auth_org_id()
    )
    AND get_auth_role() IN ('super_admin','event_manager')
  );

-- ──────────────────────────────────────────────
-- 7. operation_templates
-- ──────────────────────────────────────────────

CREATE POLICY "templates_select" ON operation_templates
  FOR SELECT USING (
    is_system = TRUE OR organization_id = get_auth_org_id()
  );

CREATE POLICY "templates_write" ON operation_templates
  FOR ALL USING (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager')
  )
  WITH CHECK (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager')
  );

-- ──────────────────────────────────────────────
-- 8. event_attendees (new table)
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_attendees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  full_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  ticket_type     TEXT NOT NULL DEFAULT 'general',
  ticket_code     TEXT UNIQUE,
  checked_in      BOOLEAN NOT NULL DEFAULT FALSE,
  checked_in_at   TIMESTAMPTZ,
  checked_in_by   UUID REFERENCES profiles(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendees_event ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_ticket ON event_attendees(ticket_code);

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendees_select" ON event_attendees
  FOR SELECT USING (organization_id = get_auth_org_id());

CREATE POLICY "attendees_insert" ON event_attendees
  FOR INSERT WITH CHECK (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager','office_staff','onsite_staff')
  );

CREATE POLICY "attendees_update" ON event_attendees
  FOR UPDATE USING (organization_id = get_auth_org_id())
  WITH CHECK (organization_id = get_auth_org_id());

-- ──────────────────────────────────────────────
-- 9. event_payments (new table)
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  payer_name      TEXT NOT NULL,
  amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_type    TEXT NOT NULL DEFAULT 'cash'
                    CHECK (payment_type IN ('cash','upi','card','bank_transfer','other')),
  reference_no    TEXT,
  description     TEXT,
  collected_by    UUID REFERENCES profiles(id),
  payment_date    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_event ON event_payments(event_id);

ALTER TABLE event_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select" ON event_payments
  FOR SELECT USING (organization_id = get_auth_org_id());

CREATE POLICY "payments_insert" ON event_payments
  FOR INSERT WITH CHECK (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin','event_manager','office_staff')
  );
