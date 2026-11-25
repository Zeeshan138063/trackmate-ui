# Invitation limits tracker

REQ-009, 2026-11-26. Implements REQ-009 (strategy spec section 5E). Builds on REQ-003.

## Why

LinkedIn limits connection invitations, and an account that hits the limit is restricted for
about a week. The strategy spec's figure is about 100 a week: widely observed, not published by
LinkedIn. A user sending 15 to 20 a day gets close fast, and JobOS currently prompts "Send a
connection request" with no idea how many have gone out.

## Goals

- The user can mark, in one click, that they sent a connection invitation to a contact.
- JobOS counts invitations in the last seven days, warns at 80 and stops suggesting more at 100.

## Non-goals

- JobOS does not send, detect or read invitations on LinkedIn (P1). The count is only what the
  user marks.
- No editable thresholds. 80 and 100 are constants (DEC-008).
- It does not track invitations sent to people who are not contacts in JobOS.

## Acceptance criteria

- **AC-1** A contact has an optional "invitation sent" date. A contact at stage Engaged whose
  next action is "Send a connection request" has a "Mark invitation sent" button on its card
  and in the Today lists, which sets it to now.
- **AC-2** `invitationUsage(sentDates, today)` is pure and returns the count in the rolling
  seven days ending today and a state: `ok` below 80, `warn` from 80 to 99, `stop` at 100 or
  more.
- **AC-3** After an invitation is marked sent, the contact's next action is "none: invitation
  sent on <date>, mark Connected when they accept" for 14 days, then "Check on your invitation".
- **AC-4** At `stop`, no contact's next action is "Send a connection request"; it is "none:
  weekly invitation limit reached, next slot on <date>", the date the oldest counted invitation
  leaves the window.
- **AC-5** Connections shows "Invitations in the last 7 days: N of 100", amber at `warn` with
  "Slow down: LinkedIn restricts accounts near 100 a week", red at `stop`.
- **AC-6** Moving a contact to Connected keeps the invitation date (it still counts for its
  seven days).
- **AC-7** Before the migration is applied everything else works; marking an invitation shows
  an error (P10).

## The contract change

Migration, additive: `contacts.invitation_sent_at timestamptz null`. Existing RLS on `contacts`
covers it.

## Decisions and open questions

- **DEC-008** (proposed): warn at 80, stop at 100 invitations in a rolling seven days, as the
  strategy spec states. The spec notes the 100 figure is observed, not published, so the UI
  says "about 100".

## Risks

- The count misses invitations sent outside JobOS, so it can read low. Mitigation: the label
  says "marked in JobOS".
