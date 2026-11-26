-- Job intake: job-board feeds added beside the LinkedIn fetch (DEC-001, DEC-011), and honest posting dates.

-- 1. The hourly LinkedIn fetch stays scheduled (DEC-011). An earlier draft of this migration
--    unscheduled it; that step was removed before the migration was applied anywhere.

-- 2. posted_at used to default to the insert time, so a "posted" date was often just the moment
--    JobOS first saw the job. Keep the two apart: first_seen_at is always known, posted_at only
--    when the source states it.
alter table public.discovered_jobs add column if not exists first_seen_at timestamptz not null default now();
update public.discovered_jobs set first_seen_at = created_at where created_at is not null and first_seen_at > created_at;
alter table public.discovered_jobs alter column posted_at drop default;

comment on column public.discovered_jobs.posted_at is
  'When the employer published the posting, as stated by the source. Null when the source does not say. Rows created before 2026-11-26 may hold the first-seen time here.';
comment on column public.discovered_jobs.first_seen_at is
  'When JobOS first saw the posting.';

alter table public.discovered_jobs alter column source drop default;

-- 3. Search: filter and report on the best date we have, and say which kind it is.
drop function if exists match_jobs(vector, float, int, int, timestamptz, boolean);

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
  first_seen_at timestamptz,
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
    discovered_jobs.first_seen_at,
    discovered_jobs.description,
    discovered_jobs.source,
    1 - (discovered_jobs.embedding <=> query_embedding) as similarity
  from discovered_jobs
  where 1 - (discovered_jobs.embedding <=> query_embedding) > match_threshold
  and (min_posted_date is null or coalesce(discovered_jobs.posted_at, discovered_jobs.first_seen_at) >= min_posted_date)
  and (
    is_remote is null
    or (is_remote = true and discovered_jobs.location ilike '%remote%')
    or (is_remote = false and (discovered_jobs.location is null or discovered_jobs.location not ilike '%remote%'))
  )
  order by discovered_jobs.embedding <=> query_embedding
  limit match_count
  offset offset_val;
end;
$$;

-- 4. Archiving must also use the best date we have, or rows without a posting date never leave.
create or replace function public.archive_old_jobs()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with moved_rows as (
    delete from public.discovered_jobs
    where coalesce(posted_at, first_seen_at) < now() - interval '15 days'
    returning id, external_id, title, company, location, job_url, posted_at, keyword, source, description, embedding, created_at
  )
  insert into public.archived_jobs (id, external_id, title, company, location, job_url, posted_at, keyword, source, description, embedding, created_at)
  select id, external_id, title, company, location, job_url, posted_at, keyword, source, description, embedding, created_at
  from moved_rows;
end;
$$;
