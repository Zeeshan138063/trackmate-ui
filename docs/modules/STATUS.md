# Module status board

One row per module. Updated in every pull request that changes a module's state. Append; do not
reorder rows another pull request may also touch.

| Module | Status | Next step | Handoff |
|---|---|---|---|
| web-app | in-progress | Audit against spec section 8, then make `npm run verify` green | [web-app.md](web-app.md) |
| backend | in-progress | Deploy the intake change (db push, then `fetch-jobs`); add a Workable feed | [backend.md](backend.md) |
| followups | done | None planned; reference pattern for new backend work | [followups.md](followups.md) |
| extension | in-progress | Narrow `host_permissions`; LinkedIn readers kept as they are (DEC-001) | [extension.md](extension.md) |
| site (repo `jobos`) | in-progress | Evidence or remove the figures on the home page (P8) | [site.md](site.md) |
