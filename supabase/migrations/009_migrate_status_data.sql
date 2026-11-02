-- Migrate existing checklist item statuses to new simplified 6-value set
-- Must run in a separate transaction from the ALTER TYPE that added the new values
UPDATE event_checklist_items SET status = 'pending'  WHERE status IN ('not_started', 'in_progress', 'prepared');
UPDATE event_checklist_items SET status = 'at_venue' WHERE status IN ('delivered', 'venue_verified');
UPDATE event_checklist_items SET status = 'done'     WHERE status IN ('completed', 'not_applicable');
UPDATE event_checklist_items SET status = 'issue'    WHERE status IN ('blocked', 'shortage', 'damaged', 'cancelled');
-- 'packed' and 'dispatched' remain unchanged
