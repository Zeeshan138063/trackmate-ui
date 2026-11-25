-- REQ-009: when the user marked a LinkedIn connection invitation to this contact as sent.
-- Spec: docs/specs/2026-11-26-invitation-limits-design.md
--
-- Set only by the user clicking "Mark invitation sent". JobOS never sends, detects or reads
-- invitations on LinkedIn (P1). Additive; existing RLS on contacts covers it (P5).

alter table public.contacts add column if not exists invitation_sent_at timestamptz;

comment on column public.contacts.invitation_sent_at is
  'When the user marked a connection invitation to this contact as sent. Counted over a rolling seven days by the invitation limits tracker.';

create index if not exists contacts_user_invitation_sent_idx
  on public.contacts (user_id, invitation_sent_at)
  where invitation_sent_at is not null;
