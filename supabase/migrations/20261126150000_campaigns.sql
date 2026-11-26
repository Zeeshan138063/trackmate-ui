-- REQ-001: the user's campaign: what they are looking for and what limits them.
-- Spec: docs/specs/2026-11-26-campaign-setup-design.md
--
-- One row per user. The app reads and upserts it; job fit caps (REQ-008) and the daily queue
-- limit read it.

create table if not exists public.campaigns (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  role_titles text[] not null default '{}' check (cardinality(role_titles) <= 20),
  regions text[] not null default '{}' check (cardinality(regions) <= 20),
  remote_ok boolean not null default true,
  citizenships text[] not null default '{}' check (cardinality(citizenships) <= 20),
  languages text[] not null default '{}' check (cardinality(languages) <= 20),
  needs_sponsorship boolean not null default false,
  years_experience numeric check (years_experience is null or years_experience between 0 and 60),
  pay_floor numeric check (pay_floor is null or pay_floor >= 0),
  pay_currency text not null default 'USD' check (pay_currency ~ '^[A-Z]{3}$'),
  earliest_start date,
  daily_capacity integer not null default 10 check (daily_capacity between 3 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.campaigns is
  'One job-search campaign per user: target roles, regions, constraints and daily capacity.';
comment on column public.campaigns.needs_sponsorship is
  'True when the user needs an employer to sponsor a work visa.';
comment on column public.campaigns.daily_capacity is
  'How many items a day the Today list shows (3 to 30).';

create or replace function public.campaigns_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists campaigns_touch_updated_at on public.campaigns;
create trigger campaigns_touch_updated_at
  before update on public.campaigns
  for each row execute function public.campaigns_touch_updated_at();

-- P5: fenced in the same migration that creates it.
alter table public.campaigns enable row level security;

drop policy if exists "Users can read their own campaign" on public.campaigns;
create policy "Users can read their own campaign"
  on public.campaigns for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own campaign" on public.campaigns;
create policy "Users can create their own campaign"
  on public.campaigns for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can change their own campaign" on public.campaigns;
create policy "Users can change their own campaign"
  on public.campaigns for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own campaign" on public.campaigns;
create policy "Users can delete their own campaign"
  on public.campaigns for delete
  to authenticated
  using (auth.uid() = user_id);

revoke all on public.campaigns from anon;
