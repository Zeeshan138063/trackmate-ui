# The plan

The **why**, the scope and the order. Two kinds of entry carry IDs.

## Decisions: `DEC-###`

Product and business choices, in the words of whoever made them.

```markdown
### DEC-018 Late fees are charged per started hour, capped at one day's rate
- Decided by: head of operations, 2026-03-04
- Words given: "Per started hour, never more than a full day."
- Affects: REQ-041; spec specs/2026-03-05-late-fees-design.md
```

Technical decisions that bind the code go in `architecture/decisions/` as ADRs.

## Decisions made

### DEC-001 JobOS takes jobs from job-board feeds, not from LinkedIn or search results
- Decided by: Zee (product owner), 2026-11-26
- Words given: "Remove server fetch only": drop the hourly LinkedIn fetch and the LinkedIn URL
  reader, replace intake with job-board feeds and paste-a-URL, and keep the extension reading
  pages the user has open, since the site advertises it.
- Affects: OQ-01 (closed); REQ-008; `supabase/functions/fetch-jobs/`; migration
  `20261126110000_job_intake_allowed_sources.sql`; principle P1.

## Open questions: `OQ-##`

A question someone outside engineering must answer. See `questions/README.md`: each one is also
restated in the repo where the code depends on it, so the repo is enough on its own.
