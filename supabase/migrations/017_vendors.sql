-- ─────────────────────────────────────────────────────────────────
-- 017 · Vendors
-- vendors — supplier contacts per organization
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE vendors (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  phone            TEXT NOT NULL,
  category         TEXT,          -- what they supply, e.g. 'AV Equipment', 'Stationery'
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendors_org ON vendors(organization_id);

CREATE TRIGGER trg_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read vendors"
  ON vendors FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "admins manage vendors"
  ON vendors FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles
    WHERE id = auth.uid() AND role IN ('super_admin','event_manager','office_staff')
  ));
