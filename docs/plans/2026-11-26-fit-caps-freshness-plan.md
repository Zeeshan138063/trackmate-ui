# Plan: fit caps and fresh jobs

Spec: `docs/specs/2026-11-26-fit-caps-freshness-design.md`. Approved by: Zee, 2026-11-26.

Branch `jobos/fit-caps`, stacked on `jobos/campaign-setup`, into `rebranding-jobos`.

## Tasks

| # | Task | Serves | Test first |
|---|---|---|---|
| T1 | `src/utils/job-fit.ts` | AC-1 to AC-3, AC-6 | `job-fit.test.ts` (15 tests) |
| T2 | Fresh jobs in `daily-queue.ts`, `useDailyQueue.ts`, `DailyQueue.tsx` | AC-7, AC-8 | 3 new tests in `daily-queue.test.ts` |
| T3 | `FitCaps.tsx`; badges, details and the hide tick box on Jobs | AC-4, AC-5 | render check; manual |
| T4 | Docs: CHANGELOG, work.md, DEC-010, requirements, `src/CLAUDE.md` | all | |

## How we will know it is done

| AC | Evidence | Result, 2026-11-26 |
|---|---|---|
| AC-1 to AC-3, AC-6 | `npm test` (`job-fit.test.ts`) | pass, 15 tests |
| AC-7 (order, cap of three, hiding) | `npm test` (`daily-queue.test.ts`) | pass |
| AC-5 | server render of `FitCapBadges` and `FitCapDetails` | pass |
| AC-4, AC-5, AC-7, AC-8 in the app | browser, with real found jobs | not run: needs Zee |
| all | `tsc` 28 errors (baseline 28), `eslint` 199 errors and 23 warnings (unchanged), `vite build` | pass |
