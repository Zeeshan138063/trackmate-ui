## What and why

Ticket: TICKET-123. Spec: `docs/specs/...`. Implements: REQ-###, AC-#.

## Evidence

| AC | Evidence |
|---|---|
| AC-1 | test name, command output or screenshot |

## Checklist

- [ ] CHANGELOG.md has a line for this pull request
- [ ] work.md, the module handoff and STATUS.md are updated
- [ ] Any new decision has an ADR; any open question is restated where the code depends on it
- [ ] Schema changed? New migration only, RLS in it, `src/integrations/supabase/types.ts` regenerated
- [ ] `npm run verify`: type and lint error counts before and after
- [ ] Nothing deployed to Supabase without approval
- [ ] Reviewers run: spec-reviewer, and the ones this change needs
- [ ] 0 commits behind main, and nothing deleted that I did not mean to delete
