# Plan: referral-first prompt

Spec: `docs/specs/2026-11-26-referral-first-prompt-design.md`. Approved by: <pending>.

Branch `feat/referral-first`, stacked on `feat/daily-queue`.

## Tasks

| # | Task | Serves | Test first |
|---|---|---|---|
| T1 | `referralCandidates(company, contacts)` in `src/utils/company-match.ts` | AC-1, AC-6 | `company-match.test.ts`: stage threshold, exact only, do-not-contact excluded, advocates first |
| T2 | `src/components/contacts/ReferralPrompt.tsx`: banner listing up to three people, "Not now" remembered per job in the browser | AC-2, AC-3 | render check; manual |
| T3 | `EditJobDialog.tsx`: banner above the tabs for Bookmarked and Applying jobs; one confirm when the status is saved as Applied while the banner shows | AC-2, AC-3, AC-4 | manual |
| T4 | `daily-queue.ts`: application items take an optional referral name and add it to the reason; `useDailyQueue.ts` passes it | AC-5 | `daily-queue.test.ts` |
| T5 | Docs: CHANGELOG, work.md, DEC-007, `src/CLAUDE.md` | all | |

## Files

- New: `src/components/contacts/ReferralPrompt.tsx`.
- Changed: `src/utils/company-match.ts` and its test, `src/utils/daily-queue.ts` and its test,
  `src/hooks/useDailyQueue.ts`, `src/components/EditJobDialog.tsx`.
- Not touched: database, edge functions, extension.

## How we will know it is done

| AC | Evidence |
|---|---|
| AC-1, AC-5, AC-6 | `npm test` |
| AC-2 to AC-4 | manual checks in the pull request |
| All | type and lint counts no worse than baseline; build passes |
