# Contact stages and next actions

REQ-003, 2026-11-26. Implements REQ-003 from `docs/prd/requirements.md` (strategy spec section 5E).
First of the relationship-pipeline features; REQ-004, 006, 007 and 009 read what this adds.

## Why

Connections is a list with a search box. A user with 40 contacts cannot tell who to act on today
or why: every contact looks the same, and the only prompt is a reminder the user set by hand.
The strategy spec makes the relationship pipeline the centre of the product, and that starts with
knowing where each relationship stands and what the next step is.

## Goals

- Every contact has a role type and a warmth stage the user can see and change.
- Every contact has exactly one next action with a due date and a reason, worked out from its
  stage and its logged interactions, or an explicit "nothing to do" with the reason.
- Connections opens on a short ordered list of the people to act on today.
- Do-not-contact is one click and is respected everywhere, including by the follow-up agent.

## Non-goals

- No message drafts (REQ-005), no daily queue across the whole product (REQ-004), no limits
  tracker (REQ-009), no referral prompt (REQ-007), no connections import.
- No editable cadence templates per role type (P1 in the spec). The rules ship as fixed defaults
  in one file.
- JobOS does nothing on LinkedIn (P1). Every action is a prompt; the user does it and logs it.
- No automatic stage changes. JobOS suggests the next stage; the user confirms (DEC-002).

## Acceptance criteria

- **AC-1** A contact has a role type: recruiter, hiring manager, peer, alumni or other. It is set
  when adding or editing a contact and shown on the card. Existing contacts read as "other".
- **AC-2** A contact has a warmth stage: Identified, Following, Engaged, Connected,
  In conversation, Advocate. New and existing contacts start at Identified. The stage is shown on
  the card and can be changed from the card and the detail dialog.
- **AC-3** For any contact, `nextAction(contact, interactions, reminders, today)` returns one
  action with `kind`, `label`, `reason` and `dueDate`, or `none` with a reason. It is a pure
  function with no clock and no network.
- **AC-4** The rules, in order of precedence:
  1. Do-not-contact: no action.
  2. Snoozed until a future date: no action until that date.
  3. A pending manual reminder: that reminder, on its due date.
  4. An inbound interaction newer than every outbound one: "Reply", due now.
  5. A call or meeting logged in the last 2 days with no later outbound message: "Send a
     thank-you", due the day of the call.
  6. Otherwise by stage:
     - Identified: "Follow them", due now.
     - Following: "Engage with a recent post", due 2 days after the last outbound interaction
       or the stage change. After 2 outbound interactions since the stage change: suggest
       Engaged.
     - Engaged: "Send a connection request with a short note", due 1 day after the stage change.
     - Connected: "Ask for advice", due 2 days after the stage change. With no reply: follow up
       6 days after the last outbound message, at most 2 follow-ups, then rest 30 days.
     - In conversation: "Check in", due 14 days after the last interaction.
     - Advocate: "Keep in touch", due 30 days after the last interaction.
- **AC-5** A contact in the follow-up agent's nurture track with a future `next_touch_at` shows
  "Keep in touch" due on that date instead of a stage rule, so the two systems never disagree.
- **AC-6** When the history implies a later stage (2 outbound interactions while Following; any
  inbound interaction while Connected), the card shows "Suggested: <stage>" with one click to
  accept. Nothing changes until the user clicks.
- **AC-7** Connections shows a "Today" section above the list: contacts whose next action is due
  today or earlier, most overdue first, at most 10 with a "show all" control. Each row shows the
  name, company, action, reason, and buttons: Log it (opens the existing interaction dialog),
  Snooze (1, 3 or 7 days) and Open.
- **AC-8** Contacts can be filtered by stage and by role type.
- **AC-9** Marking a contact do-not-contact removes it from Today, shows a badge on the card, and
  sets the same `relationship_stage = 'do_not_contact'` the follow-up agent already checks.
- **AC-10** Before the migration is applied, Connections still loads and saves: contacts read as
  Identified and "other", and a failed stage save shows an error (P10).
- **AC-11** Another user's contacts, stages and interactions are never readable (P5).

## The contract change

Migration, additive only, on `public.contacts`:

| Column | Type | Notes |
|---|---|---|
| `role_type` | text, null | check in (`recruiter`, `hiring_manager`, `peer`, `alumni`, `other`) |
| `warmth_stage` | text not null default `identified` | check in the six stages |
| `warmth_stage_changed_at` | timestamptz not null default now() | set by a trigger when `warmth_stage` changes |
| `next_action_snoozed_until` | date, null | |

No new table, so the existing RLS policies on `contacts` cover it. Do-not-contact reuses the
existing `relationship_stage` column. The free-text `relationship` column stays: it is "how I
know them", which the spec also asks for.

No edge function changes. The engine runs in the browser from rows the user can already read.

## Decisions and open questions

- **DEC-002** (proposed): stage changes are confirmed by the user, never automatic. Reason: a
  stage is a claim about a relationship, and only the user knows if a comment was genuine or a
  message was really a conversation.
- **DEC-003** (proposed): the timings in AC-4 are defaults taken from the strategy spec section
  5E ("at most two follow-ups, 5-7 days apart, then the contact rests for 30 days") and are
  constants in one file. Making them editable is the cadence-templates feature.
- Needs approval: adding `vitest` as a dev dependency so the engine can be tested in `src/`.
- Needs an ADR: no.

## Risks

- The rules are opinionated and will be wrong for some users. Mitigation: every action shows its
  reason, can be snoozed, and the constants are in one place.
- Interactions are only as good as what the user logs. Mitigation: "Log it" is one click from
  the Today row.
- Loading every interaction to compute the list costs one extra query. Fine for hundreds of
  contacts; revisit if a user has thousands.
