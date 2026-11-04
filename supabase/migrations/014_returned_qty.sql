-- Phase 4: Post-event return tracking for reusable items
ALTER TABLE event_checklist_items
  ADD COLUMN IF NOT EXISTS returned_qty INT NOT NULL DEFAULT 0;
