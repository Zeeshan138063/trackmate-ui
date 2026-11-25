# JobOS app (repo: trackmate-ui)

Repo-wide rules. Every session reads this file, then the `CLAUDE.md` closest to the files it will
change. Keep this file short; component detail lives in the scoped files.

## What this repo is

JobOS is a personal CRM for a job search: applications, contacts, target companies, resumes, job
discovery and an approval-based follow-up agent. This repo holds three of its four parts.

| Part | Folder | Read |
|---|---|---|
| CRM web app (app.jobos.dev): Vite + React 18 + TypeScript SPA | `src/` | `src/CLAUDE.md` |
| Backend: Supabase Postgres, auth, edge functions, pg_cron | `supabase/` | `supabase/CLAUDE.md` |
| Follow-up agent (inside the backend, layered, tested) | `supabase/functions/_shared/followups/` | its own `CLAUDE.md`, and `docs/FOLLOWUPS.md` |
| Chrome extension (Manifest V3, plain JS, no build) | `extension/` | `extension/CLAUDE.md` |
| Marketing site (jobos.dev) | separate repo `Zeeshan138063/jobos` | that repo's `CLAUDE.md` |

There is no API server. The browser and the extension talk to Supabase directly and row level
security scopes every query to the signed-in user. Anything that needs a secret or a schedule runs
in an edge function.

**Branch.** Product work happens on **`rebranding-jobos`**. Branch from it and open pull requests
into it. `main` is an older line that lacks the rebrand, the side-panel extension and resume
attachments; do not base work on it.

**Names.** The product is **JobOS** and the rebrand is done in the app and the extension. The repo
is still called `trackmate-ui`, the package is `careerpilot-ui`, and a few identifiers keep the
old name (the `CAREERPILOT_FETCH_JOB_DATA` message, `careerpilot_notified_` storage keys). Do not
rename those without a spec: other code depends on the strings matching.

## Commands

```bash
npm install
npm run dev              # web app on http://localhost:8080
npm run typecheck        # tsc, app code
npm run lint             # eslint
npm run build            # vite build
npm run verify           # typecheck + lint + build: the one command people, CI and Claude run
npm run test:followups   # Deno tests for the follow-up agent (needs deno installed)
```

Baseline on 2026-11-26, `rebranding-jobos` at `2809c70`: `build` passes, `typecheck` reports 28
errors, `lint` reports 201 errors and 23 warnings. So `verify` is red today. Until the clean-up ticket lands, a
change must not add to either count: run both before and after and put the numbers in the pull
request. Never get a check to pass by loosening `tsconfig*.json` or `eslint.config.js`.

Backend commands (`supabase db push`, `supabase functions deploy ...`) act on the one live project,
`jdplobgtxzncwxhordah`. There is no staging project. **Never run them without Zee saying so in
this session.** Write the migration or function, show the diff, and stop.

## Finding code

Two code graphs are set up. Use them before grep; they are faster and cost fewer tokens.

- **CodeGraph** (`.codegraph/`, local SQLite index, exposed as MCP tools `codegraph_*`).
  Symbol search, callers, callees, "what does this task touch".
  CLI equivalents: `codegraph query <name>`, `codegraph explore <question>`,
  `codegraph callers <symbol>`, `codegraph context <task>`. Refresh with `codegraph sync`.
- **graphify** (`graphify-out/`). Read `graphify-out/GRAPH_REPORT.md` for the hubs and clusters
  before an architecture question. Then `graphify query "<question>"`,
  `graphify explain "<node>"`, `graphify affected "<node>"`. After editing code run
  `graphify update .` (no LLM needed).

Neither tool is installed? See `docs/runbooks/code-graphs.md`. Fall back to grep only then.

`.agents/workflows/` holds older agent notes for this repo (UI, extension, testing) and
`.agents/skills/extension-deployment` packages the extension for the store. Where they disagree
with a `CLAUDE.md`, the `CLAUDE.md` wins; the file paths inside them point at another machine.

## How work gets done here

This repo follows the spec-driven-kit flow (`/plugin install spec-driven-kit@spec-driven-kit`).
The order is fixed. Do not skip a step because the change looks small.

1. **Read.** `docs/modules/STATUS.md`, the module handoff in `docs/modules/`, `work.md`, the
   closest `CLAUDE.md`. Look the area up in the code graphs.
2. **Spec.** `write-spec` skill: `docs/specs/YYYY-MM-DD-<feature>-design.md` with numbered
   acceptance criteria (AC-1, AC-2 ...) and the REQ IDs from `docs/prd/` it implements.
3. **Plan.** `docs/plans/YYYY-MM-DD-<feature>-plan.md`: tasks that each point at AC IDs, the files
   they touch, the tests that will prove them, and any migration.
4. **Approval. Stop here.** Post the spec and plan and wait for Zee to approve. No code, no
   migration, no dependency before that. A question only a person can answer becomes an `OQ-##`
   (`open-question` skill), restated in the code where it bites.
5. **Build.** Branch `feat/<slug>` or `fix/<slug>` off `main`. Small commits that cite the AC or
   REQ ID. Pure logic gets its test first. A choice that binds future code gets an ADR
   (`write-adr` skill).
6. **Test.** `npm run verify`, plus `npm run test:followups` if you touched `supabase/functions`.
   Then the `verify-done` skill: every AC gets a row of evidence (test name, command output or
   screenshot). Manual checks for the extension are listed in `docs/EXTENSION_TEST_CASES.md`.
7. **Review.** Run the reviewer agents the change needs: `spec-reviewer` always;
   `silent-failure-hunter` for anything with try/catch or network calls;
   `tenant-isolation-auditor` for any table, policy, RPC or edge function (here "tenant" means
   one user's data); `field-security-reviewer` for anything that returns another person's data.
8. **Hand off.** Update `CHANGELOG.md`, `work.md`, `docs/modules/<module>.md` and
   `docs/modules/STATUS.md` (`handoff` skill). Then `pr-merge-safety` before merging.

## Principles

Binding. The full table with how each is checked is `docs/architecture/principles.md`.
Going against one needs an ADR, not a judgement call in a pull request.

- **P1 No LinkedIn automation.** JobOS never clicks, connects, messages, likes, comments or posts
  on LinkedIn for the user, and its servers never fetch LinkedIn. The extension may read a
  LinkedIn page the user has open (DEC-001); it gains no new LinkedIn page types or fields.
- **P2 Assist, do not act.** JobOS prepares the action (who, why, a draft, a link). The user
  submits every application and sends every message. The follow-up agent's approval step is the
  model: nothing leaves without a human click.
- **P3 Truth only.** Generated resumes, messages and answers use only facts in the Master Profile
  and the user's notes. Never invent experience, dates, skills, location or visa status.
- **P4 No secrets in the browser.** Nothing secret in a `VITE_` variable, in `src/`, or in
  `extension/`. The Supabase anon key is public by design and is the only key allowed there.
- **P5 Every table is fenced.** Row level security on, with policies, in the migration that
  creates the table. Edge functions take the user from the verified session, never from the
  request body.
- **P6 Schema changes are new migrations.** Never edit a migration that has been applied.
  Regenerate `src/integrations/supabase/types.ts` in the same change.
- **P7 History is append-only.** Engagements, follow-up events and other audit rows are added,
  never rewritten.
- **P8 No promises about outcomes.** No copy, in the app or the site, claims guaranteed
  interviews or offers, or states a figure we cannot evidence.
- **P9 Contact data is minimal.** Store only what the user enters, pastes or captures on purpose
  about another person. Offer delete and export.
- **P10 Fail loudly.** A failed save or a fallback is shown to the user or logged. Never report
  success for something that did not happen.

## Known traps

- `src/integrations/supabase/client.ts` hardcodes the project URL and anon key. The
  `VITE_SUPABASE_*` variables in `.env.example` are not read.
- `src/integrations/supabase/types.ts` covers 13 of the 27 tables, so newer code uses
  `.from('x' as any)`. Do not copy that habit: regenerate the types.
- `GrowthEngine.publishToLinkedIn` reports success without publishing (breaks P10).
- Both `bun.lockb` and `package-lock.json` exist. npm is the package manager; the Dockerfile runs
  `npm ci`.
- `inspect_db.cjs` and `test_search.ts` in the root are loose scratch files, not part of the app.
- Resumes attached to an application live in the private `resumes` storage bucket and the
  `application_resumes` table (`src/lib/resumeFiles.ts`). There is no S3.

## Definition of done

Spec and plan approved. Every AC has evidence. `verify` no worse than the baseline (green once the
clean-up lands). New tables have RLS and a test or a manual check that user A cannot read user B.
`CHANGELOG.md`, `work.md`, the module handoff and `STATUS.md` updated. Nothing deployed to
Supabase without approval.
