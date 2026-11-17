-- 020: Lead Funnel — Ad Campaigns per event
-- Tracks ad spend, leads, and conversions per platform per event

create table public.event_ad_campaigns (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references public.events(id) on delete cascade,
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  platform            text not null,
  campaign_name       text not null,
  spend               numeric(12,2) not null default 0,
  leads_generated     integer not null default 0,
  leads_contacted     integer not null default 0,
  payment_links_sent  integer not null default 0,
  paid_registrations  integer not null default 0,
  start_date          date,
  end_date            date,
  notes               text,
  created_by          uuid references auth.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Indexes
create index idx_ad_campaigns_event on public.event_ad_campaigns(event_id);
create index idx_ad_campaigns_org on public.event_ad_campaigns(organization_id);

-- RLS
alter table public.event_ad_campaigns enable row level security;

create policy "ad_campaigns_select" on public.event_ad_campaigns
  for select using (organization_id = public.get_auth_org_id());

create policy "ad_campaigns_insert" on public.event_ad_campaigns
  for insert with check (organization_id = public.get_auth_org_id());

create policy "ad_campaigns_update" on public.event_ad_campaigns
  for update using (organization_id = public.get_auth_org_id());

create policy "ad_campaigns_delete" on public.event_ad_campaigns
  for delete using (
    organization_id = public.get_auth_org_id()
    and public.get_auth_role() in ('super_admin', 'event_manager')
  );

-- Auto-update updated_at
create or replace function update_ad_campaign_timestamp()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger trg_ad_campaign_updated
  before update on public.event_ad_campaigns
  for each row execute function update_ad_campaign_timestamp();
