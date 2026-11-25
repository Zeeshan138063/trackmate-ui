# site: handoff

- **Status:** in-progress
- **Last worked by:** Claude (Cowork session, agent setup)   **Last updated:** 2026-11-26
- **Code:** `repo Zeeshan138063/jobos`   **Rules:** `CLAUDE.md in that repo`
- **Context drop:** `docs/context/2026-11-26-agent-setup-and-architecture.md`
- **Specs:** REQ-001 to REQ-009 (none started)   **Open questions:** OQ-01

## Goal

The public site at jobos.dev: explains the product and sends people to app.jobos.dev.

## Done

- [x] Scoped `CLAUDE.md` written; code graphs built (2026-11-26). No product code changed.

## Remaining

- [ ] Home page shows two different user counts (4,800+ in Hero, 12,400+ in Testimonials).
- [ ] Footer and pricing link to app routes that do not exist (`/changelog`, `/roadmap`, `/docs`, `/help`, `/pro`, `/waitlist` and others).
- [ ] Extension claims ("20+ job sites") to be checked against `extension/content.js`.

## Next step  <- start here

List every figure and testimonial on the home page with its source, for Zee to confirm or remove (P8, spec audit question 11).

## How to run and test

```bash
npm run dev   # port 3000
npm run type-check && npm run lint && npm run build
```
