-- Resume attachments for applications, and sending them with email follow-ups.
-- Depends on 20261024120000_followup_agent.sql and 20261024130000_followup_agent_runtime.sql.
--
-- Files live in a PRIVATE Supabase Storage bucket under <user_id>/<job_id>/<file>.
-- Users can only reach their own folder; downloads use short-lived signed URLs.

-- ---------------------------------------------------------------------------
-- 1. Private bucket: PDF and DOCX only, 2 MB max (fits Gmail and Outlook limits)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes', 'resumes', false, 2097152,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Folder layout <user_id>/<job_id>/<file>: the first folder must be the caller's own id.
drop policy if exists "resumes: owner can read" on storage.objects;
create policy "resumes: owner can read" on storage.objects
  for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "resumes: owner can upload" on storage.objects;
create policy "resumes: owner can upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.jobs j
       where j.id::text = (storage.foldername(name))[2] and j.user_id = auth.uid()
    )
  );

drop policy if exists "resumes: owner can delete" on storage.objects;
create policy "resumes: owner can delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
-- No update policy: files are immutable; a new version is a new file.

-- ---------------------------------------------------------------------------
-- 2. Resume versions per application; exactly one can be "attached"
-- ---------------------------------------------------------------------------
create table if not exists public.application_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  job_id uuid not null references public.jobs on delete cascade,
  storage_path text not null unique,
  file_name text not null check (length(file_name) between 1 and 120),
  mime_type text not null check (mime_type in (
    'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 2097152),
  source text not null check (source in ('tailored', 'upload')),
  resume_json jsonb,                  -- tailored versions keep their data, so they can be reopened and edited
  content_hash text,                  -- skip saving identical tailored versions twice
  is_attached boolean not null default false,
  created_at timestamptz not null default now(),
  constraint application_resumes_path_owner check (
    storage_path like user_id::text || '/' || job_id::text || '/%'
  )
);
create unique index if not exists application_resumes_one_attached
  on public.application_resumes (job_id) where is_attached;
create index if not exists application_resumes_job_idx on public.application_resumes (job_id, created_at desc);

alter table public.application_resumes enable row level security;

drop policy if exists "application_resumes: owner can read" on public.application_resumes;
create policy "application_resumes: owner can read" on public.application_resumes
  for select using (auth.uid() = user_id);

drop policy if exists "application_resumes: owner can add" on public.application_resumes;
create policy "application_resumes: owner can add" on public.application_resumes
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.jobs j where j.id = job_id and j.user_id = auth.uid())
  );

drop policy if exists "application_resumes: owner can remove" on public.application_resumes;
create policy "application_resumes: owner can remove" on public.application_resumes
  for delete using (auth.uid() = user_id);
-- Updates only through attach_application_resume().

-- Atomically make one version the attached resume (or detach all with null).
create or replace function public.attach_application_resume(p_job_id uuid, p_resume_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null or not exists (select 1 from public.jobs where id = p_job_id and user_id = uid) then
    raise exception 'application not found' using errcode = 'no_data_found';
  end if;
  if p_resume_id is not null and not exists (
    select 1 from public.application_resumes where id = p_resume_id and job_id = p_job_id and user_id = uid
  ) then
    raise exception 'resume not found' using errcode = 'no_data_found';
  end if;

  update public.application_resumes set is_attached = false
   where job_id = p_job_id and user_id = uid and is_attached and id is distinct from p_resume_id;
  if p_resume_id is not null then
    update public.application_resumes set is_attached = true where id = p_resume_id;
  end if;
end;
$$;
revoke all on function public.attach_application_resume(uuid, uuid) from public, anon;
grant execute on function public.attach_application_resume(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Follow-ups can carry the attached resume
-- ---------------------------------------------------------------------------
alter table public.follow_ups
  add column if not exists attach_resume boolean not null default false;

alter table public.engagements
  add column if not exists attachment_name text;

-- Same function as before, plus the attach_resume patch key.
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
    attach_resume    = case when p_patch ? 'attach_resume' then (p_patch->>'attach_resume')::boolean else attach_resume end,
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


-- Same as before, plus whether the application has an attached resume.
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
      'mail_account_id', j.mail_account_id,
      'has_resume', exists (select 1 from public.application_resumes r where r.job_id = j.id and r.is_attached)
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
