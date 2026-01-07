-- Drop previous versions to avoid signature conflicts if necessary, 
-- though CREATE OR REPLACE handles same-signature updates.
-- dropping specifically if we want to ensure clean slate for changing arguments.

drop function if exists match_jobs(vector, float, int, int);

create or replace function match_jobs (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  offset_val int default 0,
  min_posted_date timestamptz default null,
  is_remote boolean default null
)
returns table (
  id uuid,
  title text,
  company text,
  location text,
  job_url text,
  posted_at timestamptz,
  description text,
  source text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    discovered_jobs.id,
    discovered_jobs.title,
    discovered_jobs.company,
    discovered_jobs.location,
    discovered_jobs.job_url,
    discovered_jobs.posted_at,
    discovered_jobs.description,
    discovered_jobs.source,
    1 - (discovered_jobs.embedding <=> query_embedding) as similarity
  from discovered_jobs
  where 1 - (discovered_jobs.embedding <=> query_embedding) > match_threshold
  -- Apply Date Filter if provided
  and (min_posted_date is null or discovered_jobs.posted_at >= min_posted_date)
  -- Apply Remote Filter if provided (simple string check on location)
  and (
    is_remote is null 
    or (is_remote = true and discovered_jobs.location ilike '%remote%')
    or (is_remote = false and discovered_jobs.location not ilike '%remote%')
  )
  order by discovered_jobs.embedding <=> query_embedding
  limit match_count
  offset offset_val;
end;
$$;
