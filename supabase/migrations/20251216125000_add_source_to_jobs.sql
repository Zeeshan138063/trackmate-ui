-- Add source column to jobs table to distinguish manual vs auto
alter table public.jobs 
add column if not exists source text default 'manual';

-- Add index for faster filtering
create index if not exists idx_jobs_source on public.jobs(source);
