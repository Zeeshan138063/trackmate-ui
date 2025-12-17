-- Add user_id to job_search_queries
alter table public.job_search_queries
add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;

-- If column exists but default is not set (from previous run), alter it
alter table public.job_search_queries
alter column user_id set default auth.uid();

-- Remove old unique constraint on just keyword (since multiple users can track same keyword now)
alter table public.job_search_queries drop constraint if exists job_search_queries_keyword_key;

-- Add new unique constraint per user
alter table public.job_search_queries drop constraint if exists job_search_queries_user_keyword_key;
alter table public.job_search_queries
add constraint job_search_queries_user_keyword_key unique (user_id, keyword);

-- RLS Policies

-- Drop existing policies to ensure clean state
drop policy if exists "Allow service role all" on public.job_search_queries;
drop policy if exists "Users can view their own queries" on public.job_search_queries;
drop policy if exists "Users can insert their own queries" on public.job_search_queries;
drop policy if exists "Users can update their own queries" on public.job_search_queries;
drop policy if exists "Users can delete their own queries" on public.job_search_queries;

create policy "Allow service role all"
  on public.job_search_queries
  to service_role
  using (true)
  with check (true);

-- Allow users to manage their own queries
create policy "Users can view their own queries"
  on public.job_search_queries for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own queries"
  on public.job_search_queries for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own queries"
  on public.job_search_queries for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own queries"
  on public.job_search_queries for delete
  to authenticated
  using (auth.uid() = user_id);
