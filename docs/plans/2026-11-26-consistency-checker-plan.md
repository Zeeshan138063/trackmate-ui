# Plan: consistency checker

Spec: `docs/specs/2026-11-26-consistency-checker-design.md`. Approved by: Zee, 2026-11-26.

Branch `jobos/consistency-checker`, stacked on `jobos/fit-caps`, into `rebranding-jobos`.

## Tasks

| # | Task | Serves | Test first |
|---|---|---|---|
| T1 | `src/utils/consistency.ts` | AC-1 to AC-6 | `consistency.test.ts` (17 tests) |
| T2 | `ConsistencyChecker` dialog on the Resume page | AC-7, AC-8 | manual |
| T3 | Docs: CHANGELOG, work.md, requirements, `src/CLAUDE.md` | all | |

## How we will know it is done

| AC | Evidence | Result, 2026-11-26 |
|---|---|---|
| AC-1 to AC-6 | `npm test` (`consistency.test.ts`) | pass, 17 tests |
| AC-7, AC-8 | browser, with a tailored resume and a real pasted profile | not run: needs Zee |
| all | `tsc` 28 errors (baseline 28), `eslint` 199 errors and 23 warnings (unchanged), `vite build` | pass |
