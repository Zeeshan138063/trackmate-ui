# web-app: handoff

- **Status:** in-progress
- **Last worked by:** Claude (Cowork session, agent setup)   **Last updated:** 2026-11-26
- **Code:** `src/`   **Rules:** `src/CLAUDE.md`
- **Context drop:** `docs/context/2026-11-26-agent-setup-and-architecture.md`
- **Specs:** REQ-001 to REQ-009 (none started)   **Open questions:** OQ-01

## Goal

The CRM the user works in every day. Under the strategy spec its centre moves from the application list to the relationship pipeline and a daily queue.

## Done

- [x] Scoped `CLAUDE.md` written; code graphs built (2026-11-26). No product code changed.
- [x] REQ-003 contact stages and next actions (2026-11-26): `src/utils/contact-next-action.ts` with tests, `src/components/contacts/`, Today list on Connections. Awaiting migration and browser check.

## Remaining

- [ ] Audit against the spec.
- [ ] Clean-up ticket: 28 type errors and 201 lint errors so `npm run verify` is green.
- [x] Novu behind `notify-reminder` (P4), 2026-11-26. Needs the secret and a deploy.
- [ ] Regenerate `src/integrations/supabase/types.ts` (covers 13 of 27 tables).
- [ ] Make `GrowthEngine.publishToLinkedIn` stop reporting success it did not have (P10), or remove it (P1).

## Next step  <- start here

Run the audit in spec section 8 (questions 4 to 10) against `src/` and fill in "State today" in `docs/prd/requirements.md`.

## How to run and test

```bash
npm run dev
npm run verify
```
