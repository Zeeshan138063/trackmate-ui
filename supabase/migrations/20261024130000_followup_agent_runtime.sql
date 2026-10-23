-- Follow-up agent (M2-M6): runtime RPCs, per-user settings, token vault, scheduler.
-- Depends on 20261024120000_followup_agent.sql.

-- ---------------------------------------------------------------------------
-- 1. Per-user follow-up settings (facts the agent may cite, signature)
-- ---------------------------------------------------------------------------
create table if not exists public.followup_settings (
  user_id uuid primary key references auth.users on delete cascade,
  enabled boolean not null default true,
  facts text not null default '',      -- one true achievement or link per line; the agent cites only these
  signature text not null default '',
  timezone text,                       -- your own zone, for quiet hours and the digest
  updated_at timestamptz not null default now()
);
alter table public.followup_settings enable row level security;
drop policy if exists "followup_settings: owner all" on public.followup_settings;
create policy "followup_settings: owner all" on public.followup_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.telegram_links
  add column if not exists pending_edit_follow_up_id uuid references public.follow_ups on delete set null,
  add column if not exists pending_edit_prompt_message_id bigint,
  add column if not exists last_digest_on date;

-- ---------------------------------------------------------------------------
-- 2. The one door for state changes: sets the actor, checks ownership and the
--    expected current state (optimistic lock), applies a whitelisted patch.
-- ---------------------------------------------------------------------------
create or replace function public.follow_up_transition(
  p_id uuid,
  p_user_id uuid,
  p_to text,
  p_actor text default 'system',
  p_expect text[] default null,
  p_patch jsonb default '{}',
  p_detail jsonb default '{}'
)
returns public.follow_ups
language plpgsql
security definer
set search_path = ''
as $$
declare
  cur public.follow_ups;
  res public.follow_ups;
begin
  select * into cur from public.follow_ups where id = p_id for update;
  if not found or (p_user_id is not null and cur.user_id <> p_user_id) then
    raise exception 'follow-up % not found', p_id using errcode = 'no_data_found';
  end if;
  if p_expect is not null and not (cur.state = any (p_expect)) then
    raise exception 'conflict: follow-up is %', cur.state using errcode = 'serialization_failure';
  end if;

  perform set_config('jobos.actor', p_actor, true);
  perform set_config('jobos.event_detail', p_detail::text, true);

  update public.follow_ups set
    state            = coalesce(p_to, state),
    draft_subject    = case when p_patch ? 'draft_subject' then p_patch->>'draft_subject' else draft_subject end,
    draft_body       = case when p_patch ? 'draft_body' then p_patch->>'draft_body' else draft_body end,
    draft_version    = case when p_patch ? 'draft_body' and p_to = 'awaiting_approval' then draft_version + 1 else draft_version end,
    edit_notes       = case when p_patch ? 'edit_note' then edit_notes || (p_patch->>'edit_note') else edit_notes end,
    due_date         = case when p_patch ? 'due_date' then (p_patch->>'due_date')::timestamptz else due_date end,
    send_at          = case when p_patch ? 'send_at' then (p_patch->>'send_at')::timestamptz else send_at end,
    approved_via     = case when p_patch ? 'approved_via' then p_patch->>'approved_via' else approved_via end,
    approved_at      = case when p_to in ('approved', 'awaiting_manual_send') then now() else approved_at end,
    sent_at          = case when p_to = 'sent' then coalesce((p_patch->>'sent_at')::timestamptz, now()) else sent_at end,
    sent_message_id  = case when p_patch ? 'sent_message_id' then p_patch->>'sent_message_id' else sent_message_id end,
    mail_account_id  = case when p_patch ? 'mail_account_id' then (p_patch->>'mail_account_id')::uuid else mail_account_id end,
    telegram_message_id = case when p_patch ? 'telegram_message_id' then (p_patch->>'telegram_message_id')::bigint else telegram_message_id end,
    retry_count      = case when p_patch ? 'retry_count' then (p_patch->>'retry_count')::smallint else retry_count end,
    last_error       = case when p_patch ? 'last_error' then p_patch->>'last_error' else last_error end,
    locked_until     = case when p_patch ? 'locked_until' then (p_patch->>'locked_until')::timestamptz
                            when p_to is not null and p_to <> 'sending' then null
                            else locked_until end
  where id = p_id
  returning * into res;

  return res;
end;
$$;
revoke all on function public.follow_up_transition(uuid, uuid, text, text, text[], jsonb, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Mail account tokens in Vault (service role only)
-- ---------------------------------------------------------------------------
create or replace function public.upsert_mail_account(
  p_user_id uuid, p_provider text, p_address text, p_refresh_token text
)
returns public.mail_accounts
language plpgsql
security definer
set search_path = ''
as $$
declare
  acct public.mail_accounts;
  secret_name text := 'mail_refresh_' || p_provider || '_' || md5(p_user_id::text || lower(p_address));
begin
  select * into acct from public.mail_accounts where user_id = p_user_id and address = lower(p_address);
  if acct.refresh_token_secret_id is not null then
    perform vault.update_secret(acct.refresh_token_secret_id, p_refresh_token);
  else
    acct.refresh_token_secret_id := vault.create_secret(p_refresh_token, secret_name, 'JobOS follow-up mail token');
  end if;

  insert into public.mail_accounts (user_id, provider, address, refresh_token_secret_id, status)
  values (p_user_id, p_provider, lower(p_address), acct.refresh_token_secret_id, 'active')
  on conflict (user_id, address) do update
    set provider = excluded.provider,
        refresh_token_secret_id = excluded.refresh_token_secret_id,
        status = 'active',
        updated_at = now()
  returning * into acct;
  return acct;
end;
$$;

create or replace function public.mail_account_refresh_token(p_account_id uuid)
returns text
language sql
security definer
set search_path = ''
as $$
  select s.decrypted_secret
    from public.mail_accounts a
    join vault.decrypted_secrets s on s.id = a.refresh_token_secret_id
   where a.id = p_account_id;
$$;

create or replace function public.set_mail_account_refresh_token(p_account_id uuid, p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare sid uuid;
begin
  select refresh_token_secret_id into sid from public.mail_accounts where id = p_account_id;
  if sid is not null then perform vault.update_secret(sid, p_token); end if;
end;
$$;

-- Clean up the vault secret when an inbox is disconnected.
create or replace function public.mail_accounts_cleanup_secret()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.refresh_token_secret_id is not null then
    begin
      delete from vault.secrets where id = old.refresh_token_secret_id;
    exception when others then
      raise warning 'could not delete vault secret %: %', old.refresh_token_secret_id, sqlerrm;
    end;
  end if;
  return old;
end;
$$;
drop trigger if exists mail_accounts_cleanup_secret on public.mail_accounts;
create trigger mail_accounts_cleanup_secret
  after delete on public.mail_accounts
  for each row execute function public.mail_accounts_cleanup_secret();

revoke all on function public.upsert_mail_account(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.mail_account_refresh_token(uuid) from public, anon, authenticated;
revoke all on function public.set_mail_account_refresh_token(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Planning candidates: one row per (job, contact) with everything the
--    cadence engine needs, so the tick makes one round trip.
-- ---------------------------------------------------------------------------
create or replace function public.follow_up_planning_candidates(p_limit int default 500)
returns table (
  user_id uuid,
  job_id uuid,
  contact_id uuid,
  job jsonb,
  contact jsonb,
  touchpoints jsonb,
  follow_ups jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    j.user_id,
    j.id,
    c.id,
    jsonb_build_object(
      'status', j.status,
      'date_applied', j.date_applied,
      'applied_via', j.applied_via,
      'do_not_followup', j.do_not_followup,
      'followups_paused', j.followups_paused,
      'response_promised_by', j.response_promised_by,
      'mail_account_id', j.mail_account_id
    ),
    jsonb_build_object(
      'relationship_stage', c.relationship_stage,
      'timezone', coalesce(c.timezone, fs.timezone, us.timezone, 'UTC'),
      'country', nullif(c.country, ''),
      'has_email', coalesce(c.email, '') <> '',
      'has_linkedin', coalesce(c.linkedin_url, '') <> ''
    ),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'at', e.date, 'direction', e.direction, 'kind', e.kind, 'channel', e.type) order by e.date)
        from public.engagements e
       where e.contact_id = c.id and e.user_id = j.user_id
         and (e.job_id = j.id or e.job_id is null)
    ), '[]'),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'kind', f.kind, 'attempt_no', f.attempt_no, 'state', f.state,
        'due_at', f.due_date, 'sent_at', f.sent_at))
        from public.follow_ups f
       where f.job_id = j.id and f.contact_id = c.id and f.state is not null
    ), '[]')
  from public.jobs j
  join public.job_contacts jc on jc.job_id = j.id
  join public.contacts c on c.id = jc.contact_id and c.user_id = j.user_id
  left join public.followup_settings fs on fs.user_id = j.user_id
  left join public.user_settings us on us.user_id = j.user_id
  where j.status in ('Applied', 'Interviewing', 'Negotiating', 'Accepted', 'Rejected')
    and coalesce(fs.enabled, true)
    and c.relationship_stage in ('active', 'nurture')
  order by j.updated_at desc
  limit p_limit;
$$;
revoke all on function public.follow_up_planning_candidates(int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Scheduler. Reads the project URL and shared secret from Vault at run time,
--    so no key is stored in the cron command. Create them once:
--      select vault.create_secret('https://<ref>.supabase.co', 'followups_project_url');
--      select vault.create_secret('<random 32+ chars>', 'followups_internal_secret');
--    and set the same secret as FOLLOWUPS_INTERNAL_SECRET on the edge functions.
-- ---------------------------------------------------------------------------
create or replace function public.followups_call_tick()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  secret text;
begin
  select decrypted_secret into base from vault.decrypted_secrets where name = 'followups_project_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'followups_internal_secret';
  if base is null or secret is null then
    raise notice 'followups tick skipped: vault secrets missing';
    return null;
  end if;
  return net.http_post(
    url := base || '/functions/v1/followups-tick',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000
  );
end;
$$;
revoke all on function public.followups_call_tick() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'followups-tick';
    perform cron.schedule('followups-tick', '*/15 * * * *', 'select public.followups_call_tick()');
  end if;
end $$;
