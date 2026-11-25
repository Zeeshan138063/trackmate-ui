# Plan: invitation limits tracker

Spec: `docs/specs/2026-11-26-invitation-limits-design.md`. Approved by: Zee, 2026-11-26.

Branch `feat/invitation-limits`, stacked on `feat/referral-first`.

## Tasks

| # | Task | Serves | Test first |
|---|---|---|---|
| T1 | `src/utils/invitation-limits.ts`: `invitationUsage(sentDates, today)` returning count, state and the date the next slot frees | AC-2, AC-4 | `invitation-limits.test.ts`: window edges, 79/80/99/100, next-slot date |
| T2 | `contact-next-action.ts`: contact gains `invitationSentAt`; `nextAction` takes the usage state. Engaged with an invitation sent waits 14 days then "Check on your invitation"; at `stop`, "connect" becomes "none" with the next-slot date | AC-3, AC-4, AC-6 | new cases in `contact-next-action.test.ts`; the 20 existing tests must still pass unchanged |
| T3 | Migration `20261126140000_contact_invitation_sent.sql`: `contacts.invitation_sent_at timestamptz` | AC-1, AC-7 | reviewed by hand |
| T4 | `types/contact.ts`, `useContactActions.ts` (computes usage from contacts, passes it to the engine, exposes it) | AC-1 to AC-4 | type-check |
| T5 | "Mark invitation sent" on the contact card and Today rows for "connect" actions; `InvitationMeter` on Connections | AC-1, AC-5 | render check; manual |
| T6 | Docs: CHANGELOG, work.md, DEC-008, `src/CLAUDE.md` | all | |

## Files

- New: `src/utils/invitation-limits.ts` and its test,
  `src/components/contacts/InvitationMeter.tsx`, the migration.
- Changed: `src/utils/contact-next-action.ts` and its test, `src/types/contact.ts`,
  `src/hooks/useContactActions.ts`, `src/components/ContactCard.tsx`,
  `src/components/contacts/TodayActions.tsx`, `src/components/DailyQueue.tsx`,
  `src/pages/Connections.tsx`.
- Not touched: edge functions, the follow-up agent, the extension.

## How we will know it is done

| AC | Evidence | Result, 2026-11-26 |
|---|---|---|
| AC-2, AC-4 | `npm test`: `src/utils/invitation-limits.test.ts` | 5 of 5 pass |
| AC-3, AC-4, AC-6 | `npm test`: "REQ-009 invitations" in `contact-next-action.test.ts` | 3 new pass; the 20 earlier tests pass unchanged (48 in total) |
| AC-5 rendering | one-off server render of `InvitationMeter` in ok, warn and stop | correct; not kept as a test |
| AC-1, AC-5, AC-7 in the browser | manual checks in the pull request | **not done** |
| All | typecheck, lint, build | 28 type errors (baseline); lint 196 errors and 22 warnings, unchanged; build passes |

## Deploy

`supabase db push` for the one column. Until then, marking an invitation shows an error and
everything else works.
