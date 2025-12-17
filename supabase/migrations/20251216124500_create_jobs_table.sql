-- Create table for discovered jobs (from scrapers)
create table if not exists public.discovered_jobs (
  id uuid default gen_random_uuid() primary key,
  external_id text unique not null, -- linkedin_123456
  title text not null,
  company text not null,
  location text,
  job_url text not null,
  posted_at timestamptz default now(),
  keyword text,
  source text default 'linkedin', -- linkedin, indeed, google
  description text, -- minimal snippet if available
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.discovered_jobs enable row level security;

-- Policies for discovered_jobs
-- Public read access
create policy "Allow public read access"
  on public.discovered_jobs for select
  using (true);

-- Service role write access (for edge functions)
create policy "Allow service role insert"
  on public.discovered_jobs for insert
  to service_role
  with check (true);

-- Table for managing search queries (keywords to scrape)
create table if not exists public.job_search_queries (
  id uuid default gen_random_uuid() primary key,
  keyword text unique not null,
  filters jsonb default '{}'::jsonb, -- e.g. { "f_E": ["2"], "f_WT": ["1"] }
  is_active boolean default true,
  last_run_at timestamptz,
  created_at timestamptz default now()
);

alter table public.job_search_queries enable row level security;

-- Only service role can manage queries for now (or admins)
create policy "Allow service role all"
  on public.job_search_queries
  to service_role
  using (true)
  with check (true);
