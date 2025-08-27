-- Complete contacts table schema replacement
-- This migration drops old columns and creates a clean new schema

-- 0) Enable required extensions
create extension if not exists pg_trgm;

-- 1) Drop old columns and constraints
alter table public.contacts 
  drop column if exists name,
  drop column if exists position,
  drop column if exists relationship;

-- 2) Add new columns with proper constraints
alter table public.contacts
  add column if not exists first_name text not null,
  add column if not exists last_name text not null,
  add column if not exists title text not null,
  add column if not exists department text,
  add column if not exists contact_type text not null default 'other' check (contact_type in ('recruiter','hiring_manager','employee','referral','networking','other')),
  add column if not exists seniority_level text check (seniority_level in ('junior','mid','senior','director','vp','c_level')),
  add column if not exists twitter_url text,
  add column if not exists github_url text,
  add column if not exists personal_website text,
  add column if not exists how_we_met text check (how_we_met in ('job_application','networking_event','referral','linkedin','twitter','github','personal_website','conference','cold_outreach','other')),
  add column if not exists relationship_strength text not null default 'cold' check (relationship_strength in ('cold','neutral','warm','strong','advocate')),
  add column if not exists last_contact_date date,
  add column if not exists next_follow_up_date date,
  add column if not exists communication_frequency text check (communication_frequency in ('weekly','monthly','quarterly','as_needed')),
  add column if not exists tags jsonb default '[]'::jsonb;

-- 3) Set default values for existing records
update public.contacts 
set 
  first_name = 'Unknown',
  last_name = 'Contact',
  title = 'Unknown',
  contact_type = 'other',
  relationship_strength = 'cold'
where first_name is null or last_name is null or title is null;

-- 4) RLS policies (idempotent)
alter table public.contacts enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='contacts' and policyname='contacts_select_own') then
    create policy contacts_select_own on public.contacts for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='contacts' and policyname='contacts_insert_own') then
    create policy contacts_insert_own on public.contacts for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='contacts' and policyname='contacts_update_own') then
    create policy contacts_update_own on public.contacts for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='contacts' and policyname='contacts_delete_own') then
    create policy contacts_delete_own on public.contacts for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 5) Helpful indexes
create index if not exists contacts_user_id_idx on public.contacts(user_id);
create index if not exists contacts_company_trgm_idx on public.contacts using gin (company gin_trgm_ops);
create index if not exists contacts_name_trgm_idx on public.contacts using gin ((coalesce(first_name,'') || ' ' || coalesce(last_name,'')) gin_trgm_ops);
create index if not exists contacts_tags_gin_idx on public.contacts using gin (tags jsonb_path_ops);


