-- Event Budget Module: cost tracking per event by category
-- v4 roadmap priority #1

-- Budget categories enum
DO $$ BEGIN
  CREATE TYPE budget_category AS ENUM (
    'ad_spend',
    'venue_facilities',
    'travel_stay',
    'gifts_merchandise',
    'inventory',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Main budget items table
CREATE TABLE IF NOT EXISTS event_budget_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  category      budget_category NOT NULL,
  label         TEXT NOT NULL,
  description   TEXT,
  planned_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_reusable   BOOLEAN NOT NULL DEFAULT false,
  qty           INTEGER NOT NULL DEFAULT 1,
  vendor_name   TEXT,
  receipt_url   TEXT,
  notes         TEXT,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_budget_items_event ON event_budget_items(event_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_org ON event_budget_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category ON event_budget_items(event_id, category);

-- RLS
ALTER TABLE event_budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_items_select" ON event_budget_items
  FOR SELECT USING (organization_id = get_auth_org_id());

CREATE POLICY "budget_items_insert" ON event_budget_items
  FOR INSERT WITH CHECK (organization_id = get_auth_org_id());

CREATE POLICY "budget_items_update" ON event_budget_items
  FOR UPDATE USING (organization_id = get_auth_org_id());

CREATE POLICY "budget_items_delete" ON event_budget_items
  FOR DELETE USING (
    organization_id = get_auth_org_id()
    AND get_auth_role() IN ('super_admin', 'event_manager')
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_budget_item_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_budget_item_updated
  BEFORE UPDATE ON event_budget_items
  FOR EACH ROW EXECUTE FUNCTION update_budget_item_timestamp();
