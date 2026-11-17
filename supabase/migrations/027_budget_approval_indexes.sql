-- 027: Add missing indexes on budget_approvals for query performance

CREATE INDEX IF NOT EXISTS idx_budget_approvals_item ON public.budget_approvals(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_budget_approvals_requester ON public.budget_approvals(requested_by);

-- Add CHECK constraints missing from earlier migrations
ALTER TABLE public.event_ad_campaigns
  ADD CONSTRAINT chk_ad_platform
    CHECK (platform IN ('meta', 'google', 'youtube', 'whatsapp', 'organic', 'referral', 'other'));

ALTER TABLE public.tour_shared_costs
  ADD CONSTRAINT chk_split_method
    CHECK (split_method IN ('equal', 'proportional_revenue', 'manual'));
