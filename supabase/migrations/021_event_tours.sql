-- 021: Tour Grouping — group events into multi-city tours
-- Enables tour-level P&L rollup with shared cost splitting

-- A) event_tours — a named tour grouping events
create table public.event_tours (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  program           text not null,
  year              integer not null,
  notes             text,
  created_by        uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_event_tours_org on public.event_tours(organization_id);

alter table public.event_tours enable row level security;

create policy "tours_select" on public.event_tours
  for select using (organization_id = public.get_auth_org_id());

create policy "tours_insert" on public.event_tours
  for insert with check (organization_id = public.get_auth_org_id());

create policy "tours_update" on public.event_tours
  for update using (organization_id = public.get_auth_org_id());

create policy "tours_delete" on public.event_tours
  for delete using (
    organization_id = public.get_auth_org_id()
    and public.get_auth_role() in ('super_admin', 'event_manager')
  );

create or replace function update_event_tour_timestamp()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger trg_event_tour_updated
  before update on public.event_tours
  for each row execute function update_event_tour_timestamp();

-- B) tour_shared_costs — costs shared across all events in a tour
create table public.tour_shared_costs (
  id                uuid primary key default gen_random_uuid(),
  tour_id           uuid not null references public.event_tours(id) on delete cascade,
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  label             text not null,
  amount            numeric(12,2) not null default 0,
  split_method      text not null default 'equal',
  notes             text,
  created_by        uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_tour_shared_costs_tour on public.tour_shared_costs(tour_id);
create index idx_tour_shared_costs_org on public.tour_shared_costs(organization_id);

alter table public.tour_shared_costs enable row level security;

create policy "shared_costs_select" on public.tour_shared_costs
  for select using (organization_id = public.get_auth_org_id());

create policy "shared_costs_insert" on public.tour_shared_costs
  for insert with check (organization_id = public.get_auth_org_id());

create policy "shared_costs_update" on public.tour_shared_costs
  for update using (organization_id = public.get_auth_org_id());

create policy "shared_costs_delete" on public.tour_shared_costs
  for delete using (
    organization_id = public.get_auth_org_id()
    and public.get_auth_role() in ('super_admin', 'event_manager')
  );

create or replace function update_tour_shared_cost_timestamp()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger trg_tour_shared_cost_updated
  before update on public.tour_shared_costs
  for each row execute function update_tour_shared_cost_timestamp();

-- C) Add tour_id to events table
alter table public.events add column tour_id uuid references public.event_tours(id) on delete set null;
create index idx_events_tour on public.events(tour_id);
