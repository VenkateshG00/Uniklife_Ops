-- 023: Post-Event Upsell Tracking
-- Links attendees who bought one program and later purchased another,
-- showing lifetime value and downstream revenue per event.

-- event_upsells — tracks cross-event purchases by the same attendee
create table public.event_upsells (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  source_event_id   uuid not null references public.events(id) on delete cascade,
  target_event_id   uuid not null references public.events(id) on delete cascade,
  attendee_name     text not null,
  attendee_email    text,
  attendee_phone    text,
  source_amount     numeric(12,2) not null default 0,
  target_amount     numeric(12,2) not null default 0,
  days_between      integer,
  notes             text,
  created_by        uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_event_upsells_org on public.event_upsells(organization_id);
create index idx_event_upsells_source on public.event_upsells(source_event_id);
create index idx_event_upsells_target on public.event_upsells(target_event_id);

alter table public.event_upsells enable row level security;

create policy "upsells_select" on public.event_upsells
  for select using (organization_id = public.get_auth_org_id());

create policy "upsells_insert" on public.event_upsells
  for insert with check (organization_id = public.get_auth_org_id());

create policy "upsells_update" on public.event_upsells
  for update using (organization_id = public.get_auth_org_id());

create policy "upsells_delete" on public.event_upsells
  for delete using (
    organization_id = public.get_auth_org_id()
    and public.get_auth_role() in ('super_admin', 'event_manager')
  );

create or replace function update_event_upsell_timestamp()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger trg_event_upsell_updated
  before update on public.event_upsells
  for each row execute function update_event_upsell_timestamp();
