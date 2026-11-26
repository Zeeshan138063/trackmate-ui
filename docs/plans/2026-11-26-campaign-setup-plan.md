# Plan: campaign setup

Spec: `docs/specs/2026-11-26-campaign-setup-design.md`. Approved by: Zee, 2026-11-26.

Branch `jobos/campaign-setup`, stacked on `jobos/message-drafting`, into `rebranding-jobos`.

## Tasks

| # | Task | Serves | Test first |
|---|---|---|---|
| T1 | `src/utils/campaign.ts` | AC-3, AC-4 | `campaign.test.ts` (10 tests) |
| T2 | Migration `20261126150000_campaigns.sql`; `campaigns` in the export and delete lists | AC-1, AC-7 | reviewed by hand |
| T3 | `useCampaign`, Campaign tab in Settings, Today limit from the campaign | AC-2, AC-5, AC-6 | render check; manual |
| T4 | Docs: CHANGELOG, work.md, DEC-006 note, requirements, `src/CLAUDE.md` | all | |

## How we will know it is done

| AC | Evidence | Result, 2026-11-26 |
|---|---|---|
| AC-3, AC-4 | `npm test` (`campaign.test.ts`) | pass, 10 tests |
| AC-2, AC-6 | server render of `CampaignSettings` with a load error | pass |
| AC-1, AC-5, AC-7 | browser and two users, after `supabase db push` | not run: needs Zee |
| all | `tsc` 28 errors (baseline 28), `eslint` 199 errors and 23 warnings (unchanged), `vite build` | pass |
