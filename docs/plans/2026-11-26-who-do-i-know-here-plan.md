# Plan: "Who do I know here?"

Spec: `docs/specs/2026-11-26-who-do-i-know-here-design.md`. Approved by: <pending>.

Branch `feat/who-do-i-know`, stacked on `feat/contact-stages-next-actions` and
`feat/job-intake-allowed-sources` (it edits `JobSearch.tsx`, which that branch also changes).

## Tasks

| # | Task | Serves | Test first |
|---|---|---|---|
| T1 | `src/utils/company-match.ts`: `normalizeCompany`, `contactsAtCompany`, `countContactable` | AC-1 to AC-4 | `company-match.test.ts` |
| T2 | `src/components/contacts/KnownContacts.tsx` (list with stage, match kind, optional link button) and `KnownContactsMarker.tsx` | AC-5 to AC-8 | manual, plus a render check |
| T3 | Tracked jobs: section in `EditJobDialog` Contacts tab; marker in `JobTable` and `JobKanban` | AC-5, AC-6, AC-8 | manual |
| T4 | Discovered jobs: marker and detail section in `JobSearch.tsx` | AC-7, AC-8 | manual |
| T5 | Docs: CHANGELOG, work.md, DEC-004, handoff | all | |

## Files

- New: `src/utils/company-match.ts`, `src/utils/company-match.test.ts`,
  `src/components/contacts/KnownContacts.tsx`, `src/components/contacts/KnownContactsMarker.tsx`.
- Changed: `src/components/EditJobDialog.tsx`, `src/components/JobTable.tsx`,
  `src/components/JobKanban.tsx`, `src/pages/Trackers.tsx`, `src/pages/JobSearch.tsx`.

## How we will know it is done

| AC | Evidence |
|---|---|
| AC-1 to AC-4 | `npm test` |
| AC-5 to AC-8 | manual checks in the pull request |
| AC-9 | no new query: uses `useContacts`, which reads through RLS |
| All | type and lint counts no worse than baseline; build passes |
