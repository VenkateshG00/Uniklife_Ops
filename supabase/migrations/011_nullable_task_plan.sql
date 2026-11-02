-- Allow tasks to exist without being linked to an operation plan
-- (org-level tasks not tied to a specific event)
ALTER TABLE event_tasks
  ALTER COLUMN operation_plan_id DROP NOT NULL;
