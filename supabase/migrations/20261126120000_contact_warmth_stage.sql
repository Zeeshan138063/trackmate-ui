-- REQ-003: contact role type, warmth stage and snooze.
-- Spec: docs/specs/2026-11-26-contact-stages-next-actions-design.md
--
-- Additive only. No new table, so the existing row level security policies on contacts cover
-- these columns (P5). Do-not-contact is NOT added here: it already exists as
-- relationship_stage = 'do_not_contact', which the follow-up agent checks.

alter table public.contacts
  add column if not exists role_type text,
  add column if not exists warmth_stage text not null default 'identified',
  add column if not exists warmth_stage_changed_at timestamptz not null default now(),
  add column if not exists next_action_snoozed_until date;

alter table public.contacts drop constraint if exists contacts_role_type_check;
alter table public.contacts add constraint contacts_role_type_check
  check (role_type is null or role_type in ('recruiter', 'hiring_manager', 'peer', 'alumni', 'other'));

alter table public.contacts drop constraint if exists contacts_warmth_stage_check;
alter table public.contacts add constraint contacts_warmth_stage_check
  check (warmth_stage in ('identified', 'following', 'engaged', 'connected', 'in_conversation', 'advocate'));

comment on column public.contacts.role_type is
  'Who this person is to the search: recruiter, hiring_manager, peer, alumni, other. Null reads as other.';
comment on column public.contacts.warmth_stage is
  'Where the relationship stands. Changed only by the user (DEC-002); JobOS may suggest.';
comment on column public.contacts.warmth_stage_changed_at is
  'Set by trigger when warmth_stage changes. Next-action rules count interactions since this time.';
comment on column public.contacts.next_action_snoozed_until is
  'The user snoozed this contact''s next action until this date.';

-- The app never sets warmth_stage_changed_at itself, so a client cannot backdate it.
create or replace function public.contacts_touch_warmth_stage()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.warmth_stage is distinct from old.warmth_stage then
    new.warmth_stage_changed_at := now();
  else
    new.warmth_stage_changed_at := old.warmth_stage_changed_at;
  end if;
  return new;
end;
$$;

drop trigger if exists contacts_touch_warmth_stage on public.contacts;
create trigger contacts_touch_warmth_stage
  before update on public.contacts
  for each row execute function public.contacts_touch_warmth_stage();

create index if not exists contacts_user_warmth_stage_idx on public.contacts (user_id, warmth_stage);
