# backend: handoff

- **Status:** blocked
- **Last worked by:** Claude (Cowork session, agent setup)   **Last updated:** 2026-11-26
- **Code:** `supabase/`   **Rules:** `supabase/CLAUDE.md`
- **Context drop:** `docs/context/2026-11-26-agent-setup-and-architecture.md`
- **Specs:** REQ-001 to REQ-009 (none started)   **Open questions:** OQ-01

## Goal

Postgres with row level security, auth, edge functions and schedules for the whole product.

## Done

- [x] Scoped `CLAUDE.md` written; code graphs built (2026-11-26). No product code changed.

## Remaining

- [ ] OQ-01: decide the fate of `fetch-linkedin-jobs` and `parse-linkedin`.
- [x] `sync-calendar` and `manage-calendar` authenticate the caller (`_shared/auth.ts`), 2026-11-26. Not yet deployed.
- [ ] Hourly cron migrations embed the anon key; move to the Vault pattern.
- [ ] Confirm every table has RLS with a user A / user B check.

## Next step  <- start here

Get OQ-01 answered. Independently: spec a fix so `sync-calendar` takes the user from the session, not the request body (P5).

## How to run and test

```bash
supabase start && supabase db reset   # local only
npm run test:followups
```
