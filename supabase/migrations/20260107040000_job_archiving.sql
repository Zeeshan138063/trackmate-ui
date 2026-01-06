-- 1. Create table for archived jobs
create table if not exists public.archived_jobs (
  id uuid default gen_random_uuid() primary key,
  external_id text,
  title text not null,
  company text not null,
  location text,
  job_url text not null,
  posted_at timestamptz,
  keyword text,
  source text,
  description text,
  embedding vector(384),
  created_at timestamptz,
  archived_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.archived_jobs enable row level security;

-- 3. Policies (Service Role only)
create policy "Allow service role all"
  on public.archived_jobs
  to service_role
  using (true)
  with check (true);

-- 4. Function to archive jobs older than 15 days
create or replace function public.archive_old_jobs()
returns void
language plpgsql
security definer
as $$
begin
  -- Move data from discovered_jobs to archived_jobs using CTE for atomicity
  with moved_rows as (
    delete from public.discovered_jobs
    where posted_at < now() - interval '15 days'
    returning id, external_id, title, company, location, job_url, posted_at, keyword, source, description, embedding, created_at
  )
  insert into public.archived_jobs (id, external_id, title, company, location, job_url, posted_at, keyword, source, description, embedding, created_at)
  select id, external_id, title, company, location, job_url, posted_at, keyword, source, description, embedding, created_at
  from moved_rows;
end;
$$;

-- 5. Schedule cron job (Run every day at 3 AM)
-- Uses pg_cron extension which was enabled in previous migrations
select cron.schedule(
  'archive-old-jobs-daily',
  '0 3 * * *',
  $$select public.archive_old_jobs()$$
);
