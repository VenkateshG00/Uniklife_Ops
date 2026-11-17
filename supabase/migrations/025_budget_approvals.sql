-- 025: Budget Approval Workflow
-- Adds approval tracking for budget line items with role-based approve/reject

-- A) budget_approvals table
CREATE TABLE public.budget_approvals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id          uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  budget_item_id    uuid REFERENCES public.event_budget_items(id) ON DELETE SET NULL,
  requested_by      uuid NOT NULL REFERENCES auth.users(id),
  approved_by       uuid REFERENCES auth.users(id),
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  amount            numeric(12,2) NOT NULL DEFAULT 0,
  category          text,
  description       text,
  rejection_reason  text,
  requested_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at       timestamptz,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_budget_approvals_org ON public.budget_approvals(organization_id);
CREATE INDEX idx_budget_approvals_event ON public.budget_approvals(event_id);
CREATE INDEX idx_budget_approvals_status ON public.budget_approvals(status);

ALTER TABLE public.budget_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_approvals_select" ON public.budget_approvals
  FOR SELECT USING (organization_id = public.get_auth_org_id());

CREATE POLICY "budget_approvals_insert" ON public.budget_approvals
  FOR INSERT WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "budget_approvals_update" ON public.budget_approvals
  FOR UPDATE USING (
    organization_id = public.get_auth_org_id()
    AND public.get_auth_role() IN ('super_admin', 'event_manager')
  );

CREATE POLICY "budget_approvals_delete" ON public.budget_approvals
  FOR DELETE USING (
    organization_id = public.get_auth_org_id()
    AND public.get_auth_role() IN ('super_admin', 'event_manager')
  );

CREATE OR REPLACE FUNCTION update_budget_approval_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_budget_approval_updated
  BEFORE UPDATE ON public.budget_approvals
  FOR EACH ROW EXECUTE FUNCTION update_budget_approval_timestamp();

-- B) Add approval_status to event_budget_items
ALTER TABLE public.event_budget_items
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));
