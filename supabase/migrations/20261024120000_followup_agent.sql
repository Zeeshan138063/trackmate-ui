-- Follow-up agent (M1): data model + state machine.
--
-- Additive only. Existing manual reminders in follow_ups keep working:
--   * legacy rows have state = NULL and keep using status (pending/completed/missed)
--   * agent rows have a state; status is derived from it by trigger, so they also
--     show up in the existing reminders list (FollowUpList) until they finish.
--
-- Domain mapping:
--   jobs         = applications
--   engagements  = touchpoints (anything that happened, in or out)
--   follow_ups   = intentions (a message we plan to send)

-- ---------------------------------------------------------------------------
-- 1. Connected inboxes (Gmail / Outlook). Tokens live in Supabase Vault.
-- ---------------------------------------------------------------------------
create table if not exists public.mail_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  provider text not null check (provider in ('gmail', 'outlook')),
  address text not null,
  refresh_token_secret_id uuid,            -- vault.secrets.id, never the token itself
  sync_cursor text,                        -- Gmail historyId / Outlook receivedDateTime
  subscription_id text,                    -- Graph subscription id (Outlook)
  watch_expires_at timestamptz,            -- Gmail watch / Graph subscription expiry
  status text not null default 'active'
    check (status in ('active', 'reauth_required', 'disabled')),
  daily_send_cap smallint not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, address)
);

alter table public.mail_accounts enable row level security;

drop policy if exists "mail_accounts: owner can read" on public.mail_accounts;
create policy "mail_accounts: owner can read"
  on public.mail_accounts for select using (auth.uid() = user_id);
drop policy if exists "mail_accounts: owner can disconnect" on public.mail_accounts;
create policy "mail_accounts: owner can disconnect"
  on public.mail_accounts for delete using (auth.uid() = user_id);
-- inserts/updates come only from edge functions (service role) after OAuth

-- ---------------------------------------------------------------------------
-- 2. Applications: how they were sent and follow-up switches
-- ---------------------------------------------------------------------------
alter table public.jobs
  add column if not exists applied_via text
    check (applied_via in ('job_board', 'email', 'linkedin')),
  add column if not exists mail_account_id uuid references public.mail_accounts on delete set null,
  add column if not exists do_not_followup boolean not null default false,
  add column if not exists followups_paused boolean not null default false,
  add column if not exists response_promised_by date;

-- ---------------------------------------------------------------------------
-- 3. Contacts: time zone (drives the send window) and relationship track
-- ---------------------------------------------------------------------------
alter table public.contacts
  add column if not exists timezone text,  -- IANA name; falls back to user_settings.timezone
  add column if not exists relationship_stage text not null default 'active'
    check (relationship_stage in ('active', 'nurture', 'dormant', 'do_not_contact')),
  add column if not exists next_touch_at timestamptz;

-- ---------------------------------------------------------------------------
-- 4. Engagements become the touchpoint log (email threading + idempotent ingest)
-- ---------------------------------------------------------------------------
alter table public.engagements
  add column if not exists kind text
    check (kind in ('application', 'followup', 'thank_you', 'reply', 'interview', 'nurture', 'note')),
  add column if not exists provider text check (provider in ('gmail', 'outlook')),
  add column if not exists mail_account_id uuid references public.mail_accounts on delete set null,
  add column if not exists thread_id text,           -- Gmail threadId / Outlook conversationId
  add column if not exists message_id text,          -- provider message id
  add column if not exists rfc822_message_id text,   -- for In-Reply-To / References
  add column if not exists subject text,
  add column if not exists classification text;     -- reply label from the classifier

create unique index if not exists engagements_provider_message_uidx
  on public.engagements (provider, message_id) where message_id is not null;
create index if not exists engagements_job_date_idx on public.engagements (job_id, date desc);
create index if not exists engagements_contact_date_idx on public.engagements (contact_id, date desc);

-- ---------------------------------------------------------------------------
-- 5. Follow-ups: the agent's state machine on top of the existing table
-- ---------------------------------------------------------------------------
alter table public.follow_ups
  add column if not exists job_id uuid references public.jobs on delete cascade,
  add column if not exists kind text
    check (kind in ('chaser', 'thank_you', 'deadline_checkin', 'nurture')),
  add column if not exists attempt_no smallint not null default 1,
  add column if not exists channel text check (channel in ('email', 'linkedin')),
  add column if not exists mail_account_id uuid references public.mail_accounts on delete set null,
  add column if not exists state text check (state in (
    'planned', 'drafting', 'awaiting_approval', 'approved', 'sending',
    'awaiting_manual_send', 'sent', 'skipped', 'cancelled', 'failed')),
  add column if not exists send_at timestamptz,
  add column if not exists draft_subject text,
  add column if not exists draft_body text,
  add column if not exists draft_version smallint not null default 0,
  add column if not exists edit_notes text[] not null default '{}',
  add column if not exists approved_via text check (approved_via in ('telegram', 'web')),
  add column if not exists approved_at timestamptz,
  add column if not exists sent_at timestamptz,
  add column if not exists sent_message_id text,
  add column if not exists telegram_message_id bigint,
  add column if not exists retry_count smallint not null default 0,
  add column if not exists last_error text,
  add column if not exists locked_until timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- Agent rows must be complete; legacy reminder rows (state null) are untouched.
alter table public.follow_ups drop constraint if exists follow_ups_agent_shape;
alter table public.follow_ups add constraint follow_ups_agent_shape check (
  state is null
  or (kind is not null and channel is not null and job_id is not null)
);

-- Idempotency key: the cadence engine can run twice and never plan a duplicate.
create unique index if not exists follow_ups_idempotency_uidx
  on public.follow_ups (job_id, contact_id, kind, attempt_no) where state is not null;
create index if not exists follow_ups_state_due_idx
  on public.follow_ups (state, due_date) where state is not null;
create index if not exists follow_ups_job_idx on public.follow_ups (job_id);

-- ---------------------------------------------------------------------------
-- 6. Audit log of every transition
-- ---------------------------------------------------------------------------
create table if not exists public.follow_up_events (
  id bigint generated always as identity primary key,
  follow_up_id uuid not null references public.follow_ups on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  from_state text,
  to_state text not null,
  actor text not null default 'system' check (actor in ('system', 'telegram', 'web', 'agent')),
  detail jsonb not null default '{}',
  at timestamptz not null default now()
);
create index if not exists follow_up_events_fu_idx on public.follow_up_events (follow_up_id, at);

alter table public.follow_up_events enable row level security;
drop policy if exists "follow_up_events: owner can read" on public.follow_up_events;
create policy "follow_up_events: owner can read"
  on public.follow_up_events for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7. Telegram link and scheduler heartbeats
-- ---------------------------------------------------------------------------
create table if not exists public.telegram_links (
  user_id uuid primary key references auth.users on delete cascade,
  chat_id bigint unique,
  link_code text unique,                   -- one-time code for t.me/<bot>?start=<code>
  link_code_expires_at timestamptz,
  quiet_start smallint not null default 23, -- local hour, cards held for the digest
  quiet_end smallint not null default 9,
  linked_at timestamptz
);
alter table public.telegram_links enable row level security;
drop policy if exists "telegram_links: owner can read" on public.telegram_links;
create policy "telegram_links: owner can read"
  on public.telegram_links for select using (auth.uid() = user_id);
drop policy if exists "telegram_links: owner can unlink" on public.telegram_links;
create policy "telegram_links: owner can unlink"
  on public.telegram_links for delete using (auth.uid() = user_id);

create table if not exists public.heartbeats (
  name text primary key,
  last_seen_at timestamptz not null default now()
);
alter table public.heartbeats enable row level security;  -- no policies: service role only

-- ---------------------------------------------------------------------------
-- 8. State machine guard. Mirrors supabase/functions/_shared/followups/state.ts.
-- ---------------------------------------------------------------------------
create or replace function public.follow_up_transition_allowed(from_state text, to_state text)
returns boolean
language sql immutable
set search_path = ''
as $$
  select (from_state, to_state) in (
    ('planned', 'drafting'), ('planned', 'skipped'), ('planned', 'cancelled'),
    ('drafting', 'awaiting_approval'), ('drafting', 'planned'), ('drafting', 'failed'),
    ('drafting', 'skipped'), ('drafting', 'cancelled'),
    ('awaiting_approval', 'approved'), ('awaiting_approval', 'awaiting_manual_send'),
    ('awaiting_approval', 'drafting'), ('awaiting_approval', 'planned'),
    ('awaiting_approval', 'skipped'), ('awaiting_approval', 'cancelled'),
    ('approved', 'sending'), ('approved', 'skipped'), ('approved', 'cancelled'),
    ('sending', 'sent'), ('sending', 'failed'), ('sending', 'approved'), ('sending', 'cancelled'),
    ('awaiting_manual_send', 'sent'), ('awaiting_manual_send', 'planned'),
    ('awaiting_manual_send', 'skipped'), ('awaiting_manual_send', 'cancelled'),
    ('failed', 'approved'), ('failed', 'skipped'), ('failed', 'cancelled')
  );
$$;

create or replace function public.follow_ups_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();

  if tg_op = 'INSERT' then
    if new.state is not null and new.state <> 'planned' then
      raise exception 'follow_ups: new agent follow-ups must start in planned, got %', new.state
        using errcode = 'check_violation';
    end if;
  elsif new.state is distinct from old.state then
    if old.state is null then
      raise exception 'follow_ups: a legacy reminder cannot become an agent follow-up'
        using errcode = 'check_violation';
    end if;
    if new.state is null or not public.follow_up_transition_allowed(old.state, new.state) then
      raise exception 'follow_ups: illegal transition % -> %', old.state, new.state
        using errcode = 'check_violation';
    end if;
  end if;

  -- Keep the legacy status column meaningful for agent rows.
  if new.state is not null then
    new.status := case
      when new.state in ('sent', 'skipped', 'cancelled') then 'completed'
      when new.state = 'failed' then 'missed'
      else 'pending'
    end;
  end if;

  return new;
end;
$$;

create or replace function public.follow_ups_log_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.state is not null
     and (tg_op = 'INSERT' or new.state is distinct from old.state) then
    insert into public.follow_up_events (follow_up_id, user_id, from_state, to_state, actor, detail)
    values (
      new.id,
      new.user_id,
      case when tg_op = 'UPDATE' then old.state end,
      new.state,
      coalesce(nullif(current_setting('jobos.actor', true), ''), 'system'),
      coalesce(nullif(current_setting('jobos.event_detail', true), '')::jsonb, '{}'::jsonb)
    );
  end if;
  return null;
end;
$$;

drop trigger if exists follow_ups_guard on public.follow_ups;
create trigger follow_ups_guard
  before insert or update on public.follow_ups
  for each row execute function public.follow_ups_guard();

drop trigger if exists follow_ups_log_event on public.follow_ups;
create trigger follow_ups_log_event
  after insert or update on public.follow_ups
  for each row execute function public.follow_ups_log_event();

-- ---------------------------------------------------------------------------
-- 9. Worker claim: lease rows so overlapping ticks never double-process.
-- ---------------------------------------------------------------------------
create or replace function public.claim_follow_ups(
  p_from_state text,
  p_to_state text,
  p_due_before timestamptz,
  p_limit int default 10,
  p_lease interval default interval '5 minutes'
)
returns setof public.follow_ups
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('jobos.actor', 'system', true);
  return query
  update public.follow_ups f
     set state = p_to_state,
         locked_until = now() + p_lease
   where f.id in (
     select id from public.follow_ups
      where state = p_from_state
        and coalesce(send_at, due_date) <= p_due_before
        and (locked_until is null or locked_until < now())
      order by coalesce(send_at, due_date)
      limit p_limit
      for update skip locked
   )
  returning f.*;
end;
$$;

revoke all on function public.claim_follow_ups(text, text, timestamptz, int, interval) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 10. Realtime for the Follow-ups tab
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables
                  where pubname = 'supabase_realtime' and tablename = 'follow_ups') then
    alter publication supabase_realtime add table public.follow_ups;
  end if;
  if not exists (select 1 from pg_publication_tables
                  where pubname = 'supabase_realtime' and tablename = 'engagements') then
    alter publication supabase_realtime add table public.engagements;
  end if;
end $$;
