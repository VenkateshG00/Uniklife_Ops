-- 022: Add budget column to events table for quick budget tracking on Payments page
alter table public.events add column if not exists budget numeric(12,2) default 0;
