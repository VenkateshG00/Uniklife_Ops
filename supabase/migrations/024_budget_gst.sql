-- 024: Add GST/tax tracking columns to budget items
-- India GST: CGST+SGST (intra-state) or IGST (inter-state); rates 0/5/12/18/28%

ALTER TABLE public.event_budget_items
  ADD COLUMN IF NOT EXISTS gst_rate numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_type text DEFAULT 'none'
    CHECK (gst_type IN ('none', 'cgst_sgst', 'igst')),
  ADD COLUMN IF NOT EXISTS hsn_code text;
