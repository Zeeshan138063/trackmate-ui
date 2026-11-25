# Work tracker

What is true now, per branch of work. Newest section at the top. Every push that changes code
updates this file (the `push-tracker-gate` hook checks). Tick what is done, add what is left, and
keep the last line of each section the next step.

## 2026-11-26 - Contact stages and next actions (REQ-003, branch feat/contact-stages-next-actions)

- [x] Spec and plan approved by Zee; DEC-002 and DEC-003 in `docs/plan/README.md`.
- [x] Engine `src/utils/contact-next-action.ts`, 20 tests (`npm test`).
- [x] Migration `20261126120000_contact_warmth_stage.sql`.
- [x] UI: stage badge, relationship controls, card next action and suggestion, Today list, filters.
- [ ] Zee: `supabase db push`. Until then everyone reads as Identified and changing a stage shows an error.
- [ ] Zee: browser check of AC-1, AC-2, AC-6 to AC-10, and a user A / user B check (AC-11).
- [ ] After merge: set REQ-003 to "exists" in `docs/prd/requirements.md`; regenerate Supabase types.
- [ ] Known limit: turning do-not-contact off sets the follow-up agent's track back to active, even if it was nurture before.
- [ ] Next: REQ-006 (match contacts to jobs by company), then REQ-004 (daily queue).
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
