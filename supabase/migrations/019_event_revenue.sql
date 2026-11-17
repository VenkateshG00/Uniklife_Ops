-- 019: Revenue & Registration Tracking
-- Two tables: event_revenue_tiers + event_revenue_adjustments

-- Adjustment types
create type public.revenue_adjustment_type as enum (
  'refund',
  'advance_booking',
  'gateway_fee',
  'discount',
  'other'
);

-- Pricing tiers per event
create table public.event_revenue_tiers (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tier_name       text not null,
  price           numeric(12,2) not null default 0,
  seats_available integer not null default 0,
  seats_sold      integer not null default 0,
  notes           text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Revenue adjustments (refunds, advance bookings, gateway fees, etc.)
create table public.event_revenue_adjustments (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type            revenue_adjustment_type not null,
  label           text not null,
  amount          numeric(12,2) not null default 0,
  notes           text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Indexes
create index idx_revenue_tiers_event on public.event_revenue_tiers(event_id);
create index idx_revenue_tiers_org on public.event_revenue_tiers(organization_id);
create index idx_revenue_adj_event on public.event_revenue_adjustments(event_id);
create index idx_revenue_adj_org on public.event_revenue_adjustments(organization_id);

-- RLS
alter table public.event_revenue_tiers enable row level security;
alter table public.event_revenue_adjustments enable row level security;

-- Revenue tiers: same-org read/write
create policy "revenue_tiers_select" on public.event_revenue_tiers
  for select using (organization_id = public.get_auth_org_id());

create policy "revenue_tiers_insert" on public.event_revenue_tiers
  for insert with check (organization_id = public.get_auth_org_id());

create policy "revenue_tiers_update" on public.event_revenue_tiers
  for update using (organization_id = public.get_auth_org_id());

create policy "revenue_tiers_delete" on public.event_revenue_tiers
  for delete using (
    organization_id = public.get_auth_org_id()
    and public.get_auth_role() in ('super_admin', 'event_manager')
  );

-- Revenue adjustments: same-org read/write
create policy "revenue_adj_select" on public.event_revenue_adjustments
  for select using (organization_id = public.get_auth_org_id());

create policy "revenue_adj_insert" on public.event_revenue_adjustments
  for insert with check (organization_id = public.get_auth_org_id());

create policy "revenue_adj_update" on public.event_revenue_adjustments
  for update using (organization_id = public.get_auth_org_id());

create policy "revenue_adj_delete" on public.event_revenue_adjustments
  for delete using (
    organization_id = public.get_auth_org_id()
    and public.get_auth_role() in ('super_admin', 'event_manager')
  );

-- Auto-update updated_at
create or replace function update_revenue_tier_timestamp()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create or replace function update_revenue_adj_timestamp()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger trg_revenue_tier_updated
  before update on public.event_revenue_tiers
  for each row execute function update_revenue_tier_timestamp();

create trigger trg_revenue_adj_updated
  before update on public.event_revenue_adjustments
  for each row execute function update_revenue_adj_timestamp();
