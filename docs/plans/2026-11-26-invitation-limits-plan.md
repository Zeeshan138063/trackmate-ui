# Plan: invitation limits tracker

Spec: `docs/specs/2026-11-26-invitation-limits-design.md`. Approved by: <pending>.

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

| AC | Evidence |
|---|---|
| AC-2 to AC-4, AC-6 | `npm test` |
| AC-1, AC-5, AC-7 | manual checks in the pull request |
| All | type and lint counts no worse than baseline; build passes |

## Deploy

`supabase db push` for the one column. Until then, marking an invitation shows an error and
everything else works.
