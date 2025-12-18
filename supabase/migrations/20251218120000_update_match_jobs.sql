-- Drop the function first because we are changing the return type (signature)
drop function if exists match_jobs(vector, float, int);
drop function if exists match_jobs(vector, double precision, int); -- cover variations

-- Re-create match_jobs with description and source
create or replace function match_jobs (
  query_embedding vector(384),
  match_threshold float,
  match_count int
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
  order by discovered_jobs.embedding <=> query_embedding
  limit match_count;
end;
$$;
