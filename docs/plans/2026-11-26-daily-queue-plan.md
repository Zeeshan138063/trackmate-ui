# Plan: daily queue

Spec: `docs/specs/2026-11-26-daily-queue-design.md`. Approved by: Zee, 2026-11-26 (top of Home;
only sources that exist; one new table).

Branch `feat/daily-queue`, stacked on `feat/who-do-i-know` (and through it on REQ-003 and job
intake).

## Tasks

| # | Task | Serves | Test first |
|---|---|---|---|
| T1 | `src/utils/daily-queue.ts`: `collectItems`, `buildDailyQueue`, `clampLimit`, `effectiveUntil` | AC-1 to AC-5, AC-11 | `daily-queue.test.ts` |
| T2 | Migration `20261126130000_daily_queue_events.sql`; add the table to the account export and delete lists | AC-8, AC-10 | reviewed by hand |
| T3 | `src/hooks/useDailyQueue.ts`, `src/components/DailyQueue.tsx`, first on `src/pages/Index.tsx` | AC-6 to AC-9, AC-11 | render check; manual |
| T4 | Deep links `/trackers?job=` and `/connections?contact=` | AC-6 | manual |
| T5 | Docs | all | |

## How we will know it is done

| AC | Evidence | Result, 2026-11-26 |
|---|---|---|
| AC-1 to AC-5, AC-11 | `npm test`: `src/utils/daily-queue.test.ts` | 10 of 10 pass (37 in total) |
| AC-6, AC-11 rendering | one-off server render of the Today card with sample data | groups, overdue note, Review for agent drafts, Log it for contacts and the limit note all rendered; not kept as a test |
| AC-6 to AC-9 in the browser | manual checks in the pull request | **not done** |
| AC-10 | RLS select and insert policies in the migration; no update or delete | by design; user A / user B check still to do |
| All | typecheck, lint, build | 28 type errors (baseline); lint 196, no increase on this stack; build passes |
