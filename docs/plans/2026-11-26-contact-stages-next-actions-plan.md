# Plan: contact stages and next actions

Spec: `docs/specs/2026-11-26-contact-stages-next-actions-design.md`. Approved by: <pending>.

## Tasks

| # | Task | Serves | Test first |
|---|---|---|---|
| T1 | Add `vitest` (dev), `npm test`, include it in `verify` | AC-3 | a trivial passing test |
| T2 | `src/utils/contact-next-action.ts`: types, constants, `nextAction`, `suggestedStage`, `dueToday` ordering | AC-3, AC-4, AC-5, AC-6, AC-7 | `contact-next-action.test.ts`, one test per rule and per precedence pair |
| T3 | Migration `2026112612xxxx_contact_warmth_stage.sql`: four columns, checks, trigger | AC-1, AC-2, AC-9, AC-11 | reviewed by hand; run on a local stack if available |
| T4 | `src/types/contact.ts`, `useContacts` (defaults for missing columns, `setStage`, `snooze`, `setDoNotContact`), `useAllEngagements` hook | AC-1, AC-2, AC-9, AC-10 | type-check |
| T5 | `ContactStageBadge`, role type and stage controls in `AddContactDialog` and `ContactDetailsDialog`, card shows stage, next action and suggestion | AC-1, AC-2, AC-6, AC-9 | manual |
| T6 | `src/components/contacts/TodayActions.tsx` and filters on `Connections.tsx` | AC-7, AC-8 | ordering covered by T2; manual for the UI |
| T7 | Docs: CHANGELOG, work.md, `docs/modules/web-app.md`, requirements state, DEC-002 and DEC-003 | all | |

## Files

- New: `src/utils/contact-next-action.ts`, `src/utils/contact-next-action.test.ts`,
  `src/hooks/useAllEngagements.ts`, `src/components/contacts/ContactStageBadge.tsx`,
  `src/components/contacts/TodayActions.tsx`, `vitest.config.ts`, the migration.
- Changed: `src/types/contact.ts`, `src/hooks/useContacts.tsx`, `src/components/ContactCard.tsx`,
  `src/components/AddContactDialog.tsx`, `src/components/ContactDetailsDialog.tsx`,
  `src/pages/Connections.tsx`, `package.json`.
- Not touched: `supabase/functions/`, the follow-up agent, the extension.

## How we will know it is done

| AC | Evidence |
|---|---|
| AC-3 to AC-6 | `npm test` output |
| AC-7 ordering | `npm test` output |
| AC-1, AC-2, AC-7 to AC-10 UI | manual checks listed in the pull request, by Zee in the browser |
| AC-11 | no new table or policy; existing `contacts` RLS; user A / user B check by Zee |
| All | `npm run verify`: type and lint counts no worse than baseline, build passes |
