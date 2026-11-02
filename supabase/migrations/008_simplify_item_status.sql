-- Add new simplified status values to the existing enum
ALTER TYPE item_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE item_status ADD VALUE IF NOT EXISTS 'at_venue';
ALTER TYPE item_status ADD VALUE IF NOT EXISTS 'done';
ALTER TYPE item_status ADD VALUE IF NOT EXISTS 'issue';

-- Add status_note column for Issue explanations
ALTER TABLE event_checklist_items
  ADD COLUMN IF NOT EXISTS status_note TEXT;
