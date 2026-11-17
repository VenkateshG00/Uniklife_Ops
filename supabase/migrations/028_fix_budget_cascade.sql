-- 028: Fix missing ON DELETE CASCADE on event_budget_items.organization_id
ALTER TABLE public.event_budget_items
  DROP CONSTRAINT event_budget_items_organization_id_fkey,
  ADD CONSTRAINT event_budget_items_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
