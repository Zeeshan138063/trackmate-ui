# Plan: message drafting from the user's notes

Spec: `docs/specs/2026-11-26-message-drafting-design.md`. Approved by: Zee, 2026-11-26.

Branch `jobos/message-drafting`, stacked on `jobos/invitation-limits`, into `rebranding-jobos`.

## Tasks

| # | Task | Serves | Test first |
|---|---|---|---|
| T1 | `src/utils/message-draft.ts`: ask ladder, prompt builder, draft check, similarity, sender facts | AC-1 to AC-5 | `message-draft.test.ts` (12 tests) |
| T2 | `AIGenerator.draftMessage`; `MessageDrafter` in the contact dialog's Connection tab; remove the old generator | AC-6 to AC-9 | render check; manual |
| T3 | Docs: CHANGELOG, work.md, DEC-009, requirements, `src/CLAUDE.md` | all | |

## Files

- New: `src/utils/message-draft.ts` and its test, `src/components/contacts/MessageDrafter.tsx`.
- Changed: `src/services/AIGenerator.ts`, `src/components/ContactDetailsDialog.tsx`.
- Not touched: database, edge functions, the follow-up agent, the extension.

## How we will know it is done

| AC | Evidence | Result, 2026-11-26 |
|---|---|---|
| AC-1 to AC-5 | `npm test` (`message-draft.test.ts`) | pass, 12 tests |
| AC-6, AC-8 | server render of `MessageDrafter` (placeholder draft shows the problem; do-not-contact shows "Drafting is off") | pass |
| AC-7, AC-9 | browser, with and without an AI key | not run: needs Zee |
| all | `tsc` 28 errors (baseline 28), `eslint` 199 errors and 23 warnings (unchanged), `vite build` | pass |
