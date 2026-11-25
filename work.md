# Work tracker

What is true now, per branch of work. Newest section at the top. Every push that changes code
updates this file (the `push-tracker-gate` hook checks). Tick what is done, add what is left, and
keep the last line of each section the next step.

## 2026-11-26 - Extension 2.0.1 (branch chore/extension-jobos)

- [x] JobOS naming in popup and manifest; default app URL `https://app.jobos.dev`; sign-up link fixed.
- [x] Bridge script limited to the app's origins (`extension/manifest.json`).
- [ ] Manual test in Chrome (not done: no browser with the extension in the build session). Run cases 1 to 3 in `docs/EXTENSION_TEST_CASES.md`, both save paths, plus logout sync.
- [ ] Publish 2.0.1 to the Chrome Web Store; the store listing name changes with it.
- [ ] Next: narrow `content.js` matches (own spec).
## 2026-11-26 - Honest results (audit stage 0, branch fix/honest-results)

- [x] No invented match scores: `src/pages/JobSearch.tsx`, `src/pages/ApplicationCopilot.tsx`; mock scan deleted.
- [x] Growth: simulated publish replaced by copy and open LinkedIn (`PostGenerator.tsx`, `GrowthEngine.ts`).
- [x] Connection note: no template fallback; cover letter prompt has truth rules.
- [x] Calendar connector: no stand-in calendars. Strategy Guide: unsourced 80% figure removed.
- [ ] Manual check in the browser (not done: no login in the build session): Job Search list, Copilot header, Growth button, contact note with and without an AI key.
- [ ] After merge: remove the stale `GrowthEngine.publishToLinkedIn` lines from `CLAUDE.md` and `src/CLAUDE.md`.
- [ ] Still open: Settings > Integrations asks for a LinkedIn client secret for a publishing feature that no longer exists.
## 2026-11-26 - Security hardening (audit stage 0, branch fix/security-hardening)

- [x] `manage-calendar`, `sync-calendar`: caller taken from the session (`supabase/functions/_shared/auth.ts`).
- [x] S3 client and AWS keys removed from the browser; `jobs.attached_resume` migration.
- [x] `notify-reminder` edge function; per-user Novu subscriber. Helper tests in `notify-reminder/message_test.ts`.
- [ ] Zee: `supabase db push`, `supabase secrets set NOVU_API_KEY=...`, deploy `manage-calendar sync-calendar notify-reminder`.
- [ ] Zee: remove `VITE_AWS_*` and `VITE_NOVU_API_KEY` from the build environment and rotate both keys.
- [ ] PR into main.

## 2026-11-26 - Agent setup: CLAUDE.md files, spec-driven-kit files, code graphs (no ticket, working tree on main, uncommitted)

- [x] Root and scoped `CLAUDE.md` (src, supabase, followups, extension) and `AGENTS.md`.
- [x] Kit files: `docs/`, `CHANGELOG.md`, `work.md`, `.gitattributes`, `.github/`, `spec-kit.json`.
- [x] Strategy spec in `docs/prd/`, REQ-001 to REQ-009 indexed.
- [x] Code graphs built and copied in (`docs/runbooks/code-graphs.md`).
- [ ] Zee: review, move to a branch, commit.
- [ ] Zee: approve `docs/architecture/principles.md`; answer OQ-01.
- [ ] Install CodeGraph and graphify on the Mac (runbook).
- [ ] Next: run the spec audit (section 8) and fill in `docs/prd/requirements.md`.

## YYYY-MM-DD - <what> (<TICKET>, branch <branch>)

- [x] Done, with the file or test that shows it.
- [ ] Left to do.
- [ ] PR into main.
