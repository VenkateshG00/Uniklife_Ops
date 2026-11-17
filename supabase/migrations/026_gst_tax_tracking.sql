-- 026: GST / Tax tracking on revenue tiers (output GST)
-- Budget item GST columns are handled by migration 024

ALTER TABLE public.event_revenue_tiers
  ADD COLUMN IF NOT EXISTS gst_rate numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_type text DEFAULT 'none' CHECK (gst_type IN ('none', 'cgst_sgst', 'igst')),
  ADD COLUMN IF NOT EXISTS hsn_code text;
