# Work tracker

What is true now, per branch of work. Newest section at the top. Every push that changes code
updates this file (the `push-tracker-gate` hook checks). Tick what is done, add what is left, and
keep the last line of each section the next step.

## 2026-11-26 - Fit caps and fresh jobs (REQ-008, branch jobos/fit-caps, into rebranding-jobos)

- [x] Spec and plan approved by Zee; DEC-010.
- [x] `src/utils/job-fit.ts`, 15 tests; fresh jobs in the daily queue, 3 tests.
- [x] Jobs: cap badges, reasons with the posting's words, "Hide jobs that rule me out".
- [ ] Zee: browser check with a saved campaign and real found jobs (needs `fetch-jobs` deployed and run).
- [ ] Known limits: English patterns only; no cap on region, pay or start date.
- [ ] Next: REQ-002 consistency checker.
- [ ] PR into rebranding-jobos.

## 2026-11-26 - Campaign setup (REQ-001, branch jobos/campaign-setup, into rebranding-jobos)

- [x] Spec and plan approved by Zee.
- [x] `src/utils/campaign.ts`, 10 tests.
- [x] Migration `20261126150000_campaigns.sql` (RLS); `campaigns` in export and delete lists.
- [x] Settings > Campaign; Today limit reads the campaign.
- [ ] Zee: `supabase db push`; redeploy `delete-account`. Until then Settings > Campaign shows a load error.
- [ ] Zee: browser check of save, reload, Today limit; user A / user B check.
- [ ] Not included: follow-up send times; pay floor and start date do not filter jobs.
- [ ] Next: REQ-008 fit caps and fresh jobs.
- [ ] PR into rebranding-jobos.

## 2026-11-26 - Message drafting (REQ-005, branch jobos/message-drafting, into rebranding-jobos)

- [x] Spec and plan approved by Zee; DEC-009 in `docs/plan/README.md`.
- [x] `src/utils/message-draft.ts`, 12 tests (`npm test`).
- [x] `MessageDrafter` in the contact dialog; `AIGenerator.draftMessage` replaces the old note generator.
- [ ] Zee: browser check with an AI key: draft, edit, Copy, Mark as sent (AC-7), and no key (AC-9).
- [ ] Known limit: the duplicate check only sees drafts saved on other contacts.
- [ ] Next: REQ-001 campaign setup.
- [ ] PR into rebranding-jobos.

## 2026-11-26 - Security hardening (branch jobos/security-hardening, into rebranding-jobos)

- [x] `manage-calendar`, `sync-calendar`: caller taken from the session (`supabase/functions/_shared/auth.ts`).
- [x] `notify-reminder` edge function; per-user Novu subscriber. Helper tests in `notify-reminder/message_test.ts`.
- [ ] Zee: `supabase secrets set NOVU_API_KEY=...`, deploy `manage-calendar sync-calendar notify-reminder`.
- [ ] Zee: remove `VITE_NOVU_API_KEY` from the build environment and rotate the key.
- [ ] PR into rebranding-jobos.

## 2026-11-26 - Honest results (audit stage 0, branch jobos/honest-results, into rebranding-jobos)

- [x] No invented match scores: `src/pages/JobSearch.tsx`, `src/pages/ApplicationCopilot.tsx`; mock scan deleted.
- [x] Growth: simulated publish replaced by copy and open LinkedIn (`PostGenerator.tsx`, `GrowthEngine.ts`).
- [x] Connection note: no template fallback; cover letter prompt has truth rules.
- [x] Calendar connector: no stand-in calendars. Strategy Guide: unsourced 80% figure removed.
- [ ] Manual check in the browser (not done: no login in the build session): Job Search list, Copilot header, Growth button, contact note with and without an AI key.
- [ ] After merge: remove the stale `GrowthEngine.publishToLinkedIn` lines from `CLAUDE.md` and `src/CLAUDE.md`.
- [ ] Still open: Settings > Integrations asks for a LinkedIn client secret for a publishing feature that no longer exists.
- [ ] PR into rebranding-jobos.

## 2026-11-26 - Data export and account deletion (audit stage 0, branch jobos/data-export-delete, into rebranding-jobos)

- [x] `delete-account` edge function; helper tests in `supabase/functions/delete-account/tables_test.ts`.
- [x] `src/services/AccountDataService.ts`, `src/components/Settings/DataManagement.tsx`, wired into Settings.
- [ ] Zee: `supabase functions deploy delete-account`, then test both buttons with a throwaway account. Not tested against the live project.
- [ ] Check the site's privacy page matches: export is JSON, deletion is immediate.
- [ ] PR into rebranding-jobos.

## 2026-11-26 - Extension 3.1.1 (branch jobos/extension-handoff, into rebranding-jobos)

- [x] Bridge answers `CAREERPILOT_FETCH_JOB_DATA`; replies to its own origin only.
- [x] Bridge injected only on `app.jobos.dev` and `job.zeeshare.com`; default URL fixed.
- [ ] Manual test in Chrome (not done in the build session): capture a job, a contact and a profile and confirm the app dialog shows the full description, not just the URL values.
- [ ] Publish 3.1.1.
- [ ] PR into rebranding-jobos.

## 2026-11-26 - Job intake on allowed sources (DEC-001, branch jobos/job-intake, into rebranding-jobos)

- [x] Removed `fetch-linkedin-jobs` and `parse-linkedin`; OQ-01 closed as DEC-001.
- [x] `fetch-jobs` reads Greenhouse, Lever and Ashby feeds for watchlist companies; `feeds.ts` with tests in `feeds_test.ts`.
- [x] Migration `20261126110000`: unschedule LinkedIn cron, `first_seen_at`, `match_jobs`, `archive_old_jobs`.
- [x] UI: "First seen" label and real source names.
- [ ] Zee, in this order: `supabase db push`; `supabase functions deploy fetch-jobs`; `supabase functions delete fetch-linkedin-jobs parse-linkedin`.
- [ ] Not run against the live project or a real feed from the build session (no network to those hosts). Check the first hourly run in the function logs.
- [ ] Follow-ups: Workable feed; paste-a-URL capture into `discovered_jobs`; the public `/jobs` page still lists rows collected from LinkedIn before this change until they archive (15 days).
- [ ] PR into rebranding-jobos.

## 2026-11-26 - Invitation limits tracker (REQ-009, branch jobos/invitation-limits, into rebranding-jobos)

- [x] Plan approved by Zee; DEC-008.
- [x] `src/utils/invitation-limits.ts` (5 tests); engine rules (3 tests); migration `20261126140000_contact_invitation_sent.sql`.
- [x] "Mark invitation sent" on the card and both Today lists; `InvitationMeter` on Connections.
- [ ] Zee: `supabase db push`. Until then marking an invitation shows an error; everything else works.
- [ ] Zee: browser check (list in the pull request).
- [ ] Known limit: only invitations marked in JobOS are counted, and one date is kept per contact.
- [ ] After merge: set REQ-007 and REQ-009 to "exists" in `docs/prd/requirements.md`.
- [ ] Next P0s: REQ-005 (drafting from notes), REQ-001 (campaign setup), REQ-008 (fit caps and freshness), REQ-002 (consistency checker).
- [ ] PR into rebranding-jobos.

## 2026-11-26 - Referral-first prompt (REQ-007, branch jobos/referral-first, into rebranding-jobos)

- [x] Plan approved by Zee; DEC-007.
- [x] `referralCandidates()` with tests; queue reason; `ReferralPrompt` banner and apply confirmation in the job dialog.
- [ ] Zee: browser check (list in the pull request). No migration, no deploy.
- [ ] Known limit: the confirmation only runs when saving from the job dialog, not when dragging a card to Applied on the kanban.
- [ ] PR into rebranding-jobos.

## 2026-11-26 - Daily queue (REQ-004, branch jobos/daily-queue, into rebranding-jobos)

- [x] Spec and plan approved by Zee; DEC-005, DEC-006.
- [x] `src/utils/daily-queue.ts`, 10 tests.
- [x] Migration `20261126130000_daily_queue_events.sql` (RLS, append-only); in export and delete lists.
- [x] Today card on Home; deep links to a job and a contact.
- [ ] Zee: `supabase db push`, then redeploy `delete-account` (its table list changed). Until the push, the list shows but Done, Snooze and Skip show an error.
- [ ] Zee: browser check (list in the pull request) and a user A / user B check on `daily_queue_events`.
- [ ] After merge: set REQ-004 to "partial: no fresh-job, practice or content items yet" in `docs/prd/requirements.md`.
- [ ] Next: REQ-007 (referral-first prompt) and REQ-009 (limits tracker), both small rules on top of REQ-003.
- [ ] PR into rebranding-jobos.

## 2026-11-26 - "Who do I know here?" (REQ-006, branch jobos/who-do-i-know, into rebranding-jobos)

- [x] Spec and plan approved by Zee; DEC-004.
- [x] `src/utils/company-match.ts`, 7 tests.
- [x] `src/components/contacts/KnownContacts.tsx`; job dialog Contacts tab, table, kanban, Job Search.
- [ ] Zee: browser check (list in the pull request). No migration, no deploy.
- [ ] After merge: set REQ-006 to "exists" in `docs/prd/requirements.md`.
- [ ] Known limit: matching is by typed company name, so "FB" will not find "Meta".
- [ ] Next: REQ-004 (daily queue), then REQ-007 (referral-first prompt), which reads these matches.
- [ ] PR into rebranding-jobos.

## 2026-11-26 - Contact stages and next actions (REQ-003, branch jobos/contact-stages, into rebranding-jobos)

- [x] Spec and plan approved by Zee; DEC-002 and DEC-003 in `docs/plan/README.md`.
- [x] Engine `src/utils/contact-next-action.ts`, 20 tests (`npm test`).
- [x] Migration `20261126120000_contact_warmth_stage.sql`.
- [x] UI: stage badge, relationship controls, card next action and suggestion, Today list, filters.
- [ ] Zee: `supabase db push`. Until then everyone reads as Identified and changing a stage shows an error.
- [ ] Zee: browser check of AC-1, AC-2, AC-6 to AC-10, and a user A / user B check (AC-11).
- [ ] After merge: set REQ-003 to "exists" in `docs/prd/requirements.md`; regenerate Supabase types.
- [ ] Known limit: turning do-not-contact off sets the follow-up agent's track back to active, even if it was nurture before.
- [ ] Next: REQ-006 (match contacts to jobs by company), then REQ-004 (daily queue).
- [ ] PR into rebranding-jobos.

## 2026-11-26 - Agent setup: CLAUDE.md files, spec-driven-kit files, code graphs (branch jobos/agent-setup, into rebranding-jobos)

- [x] Root and scoped `CLAUDE.md` (src, supabase, followups, extension) and `AGENTS.md`.
- [x] Kit files: `docs/`, `CHANGELOG.md`, `work.md`, `.gitattributes`, `.github/`, `spec-kit.json`.
- [x] Strategy spec in `docs/prd/`, REQ-001 to REQ-009 indexed.
- [x] Code graphs built and copied in (`docs/runbooks/code-graphs.md`).
- [ ] Zee: approve `docs/architecture/principles.md`; answer OQ-01.
- [ ] Install CodeGraph and graphify on the Mac (runbook).
- [ ] Next: run the spec audit (section 8) and fill in `docs/prd/requirements.md`.

## YYYY-MM-DD - <what> (<TICKET>, branch <branch>)

- [x] Done, with the file or test that shows it.
- [ ] Left to do.
- [ ] PR into rebranding-jobos.
