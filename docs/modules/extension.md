# extension: handoff

- **Status:** blocked
- **Last worked by:** Claude (Cowork session, agent setup)   **Last updated:** 2026-11-26
- **Code:** `extension/`   **Rules:** `extension/CLAUDE.md`
- **Context drop:** `docs/context/2026-11-26-agent-setup-and-architecture.md`
- **Specs:** REQ-001 to REQ-009 (none started)   **Open questions:** OQ-01

## Goal

Capture jobs, contacts and companies from the page the user is on, and fill application forms, without ever acting for the user.

## Done

- [x] Scoped `CLAUDE.md` written; code graphs built (2026-11-26). No product code changed.

## Remaining

- [ ] OQ-01: LinkedIn page readers.
- [ ] Narrow `https://*/*` permissions and bridge injection.
- [x] Hand-off fixed and bridge limited to the app (3.1.1, 2026-11-26). Not yet tested in Chrome or published.

## Next step  <- start here

Get OQ-01 answered, then spec the narrowing of `host_permissions`.

## How to run and test

```bash
# chrome://extensions > Developer mode > Load unpacked > extension/
# then the cases in docs/EXTENSION_TEST_CASES.md
```
