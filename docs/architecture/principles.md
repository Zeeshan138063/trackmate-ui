# Architecture principles

**Status: draft, written 2026-11-26 from the strategy spec and the code. Zee has not approved
them yet.** Once approved, remove this line. They are binding from then on: going against one
needs a decision record in `decisions/`, not a judgement call in a pull request.

Sources: `docs/prd/2026-11-26-crm-strategy-spec.md` section 2 (ground rules) and section 9
(exclusions), plus what the code already does well in `supabase/functions/_shared/followups/`.

| | Principle | How it is checked |
|---|---|---|
| **P1** | **No LinkedIn automation.** JobOS never clicks, connects, messages, likes, comments or posts on LinkedIn for the user, and adds no scraping of LinkedIn pages. | Edit warnings on `linkedin.com` in edge functions and on `.click()` in the extension; review. Existing conflicts: OQ-01 |
| **P2** | **Assist, do not act.** JobOS prepares the action; the user submits every application and sends every message. | Every outbound path has an approval state; test that no send happens from any other state |
| **P3** | **Truth only.** Generated text uses only facts in the Master Profile and the user's notes. | Prompt review; draft validators; spec-reviewer |
| **P4** | **No secrets in the browser.** Nothing secret in a `VITE_` variable, `src/` or `extension/`. | Edit warning on `VITE_*KEY/SECRET`; review |
| **P5** | **Every table is fenced.** RLS and policies in the creating migration; edge functions take the user from the verified session. | Edit warning on `create table`; tenant-isolation-auditor; user A / user B check |
| **P6** | **Schema changes are new migrations.** Applied migrations are never edited; types are regenerated in the same change. | Review of the diff: no modified file under `supabase/migrations/` |
| **P7** | **History is append-only.** Engagements, follow-up events and audit rows are added, never rewritten. | Database trigger for follow-ups; review elsewhere |
| **P8** | **No promises about outcomes.** No guaranteed results and no figure we cannot evidence, in the app or on the site. | Review of copy; a source for every number |
| **P9** | **Contact data is minimal.** Only what the user enters, pastes or captures on purpose; delete and export exist. | Spec review for any new field about another person |
| **P10** | **Fail loudly.** A failed save or a fallback is shown or logged; success is never reported for something that did not happen. | silent-failure-hunter |
