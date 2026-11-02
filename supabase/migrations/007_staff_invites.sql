-- Staff invite links for Option B onboarding
CREATE TABLE IF NOT EXISTS staff_invites (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  role           TEXT NOT NULL,
  phone          TEXT,
  created_by     UUID REFERENCES profiles(id),
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE staff_invites ENABLE ROW LEVEL SECURITY;

-- Managers can create and view invites for their org
CREATE POLICY "invites_insert" ON staff_invites
  FOR INSERT WITH CHECK (organization_id = get_auth_org_id());

CREATE POLICY "invites_select" ON staff_invites
  FOR SELECT USING (organization_id = get_auth_org_id());
