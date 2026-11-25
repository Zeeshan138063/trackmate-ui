-- REQ-004: what the user did with each item on their daily queue.
-- Spec: docs/specs/2026-11-26-daily-queue-design.md
--
-- Append-only (P7): rows are inserted and read, never updated or deleted by the app. The queue
-- hides an item while one of its events has effective_until >= today; the analytics feature
-- will later read the skips.

create table if not exists public.daily_queue_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_key text not null check (char_length(item_key) between 3 and 200),
  item_group text not null check (item_group in ('applications', 'followups', 'people')),
  action text not null check (action in ('done', 'snoozed', 'skipped')),
  effective_until date not null,
  created_at timestamptz not null default now()
);

comment on table public.daily_queue_events is
  'Done, snoozed and skipped actions on daily queue items. Append-only.';
comment on column public.daily_queue_events.item_key is
  'Stable item identity, e.g. contact:<uuid>:reply, job:<uuid>:deadline, agent:<uuid>.';
comment on column public.daily_queue_events.effective_until is
  'The item stays out of the queue through this date.';

create index if not exists daily_queue_events_user_until_idx
  on public.daily_queue_events (user_id, effective_until);

-- P5: fenced in the same migration that creates it.
alter table public.daily_queue_events enable row level security;

drop policy if exists "Users can read their own queue events" on public.daily_queue_events;
create policy "Users can read their own queue events"
  on public.daily_queue_events for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can add their own queue events" on public.daily_queue_events;
create policy "Users can add their own queue events"
  on public.daily_queue_events for insert
  to authenticated
  with check (auth.uid() = user_id);

-- No update or delete policy: the log is append-only. Rows go when the account is deleted.
revoke all on public.daily_queue_events from anon;
