-- Enable pgvector extension
create extension if not exists vector;

-- Add embedding column to discovered_jobs
-- We use 384 dimensions for 'gte-small' model
alter table public.discovered_jobs 
add column if not exists embedding vector(384);

-- Create an index for faster similarity search (IVFFlat)
-- Note: Requires some data to be effective, but good to have definition ready
create index on public.discovered_jobs using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create a similarity search function
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
    1 - (discovered_jobs.embedding <=> query_embedding) as similarity
  from discovered_jobs
  where 1 - (discovered_jobs.embedding <=> query_embedding) > match_threshold
  order by discovered_jobs.embedding <=> query_embedding
  limit match_count;
end;
$$;
