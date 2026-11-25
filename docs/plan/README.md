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

## Decisions: relationship pipeline

### DEC-002 A contact's warmth stage changes only when the user confirms it
- Decided by: Zee (product owner), 2026-11-26
- Words given: "Suggest, I confirm": the card shows the suggested stage with one click to
  accept, and nothing moves until the user clicks, because only they know if an interaction was
  genuine.
- Affects: REQ-003; `src/utils/contact-next-action.ts::suggestedStage`.

### DEC-003 Next-action timings are fixed defaults for now
- Decided by: Zee, 2026-11-26, by approving the REQ-003 spec
- Words given (strategy spec 5E): "at most two follow-ups, 5-7 days apart, then the contact
  rests for 30 days". Follow-up after 6 days, at most 2, rest 30; other timings in `RULES`.
- Affects: REQ-003; `src/utils/contact-next-action.ts::RULES`. Editable cadences per role type
  are a later feature.

### DEC-004 A contact count on a job only counts people definitely at that company
- Decided by: Zee, 2026-11-26
- Words given: approved "possible matches are listed separately and labelled" and "exact
  matches are counted".
- Affects: REQ-006; `src/utils/company-match.ts::countContactable`.

### DEC-005 The daily queue shows only what real features produce
- Decided by: Zee, 2026-11-26
- Words given: approved leaving out fresh high-fit jobs, the practice task and the content task
  "rather than show placeholders", to be added when those features are built.
- Affects: REQ-004; `src/utils/daily-queue.ts::collectItems`.

### DEC-006 The daily limit is a number of items kept in the browser, for now
- Decided by: Zee, 2026-11-26, by approving the REQ-004 spec
- Default 10, range 3 to 30. Replaced by campaign capacity when REQ-001 is built.
- Affects: REQ-004; `src/hooks/useDailyQueue.ts`.

### DEC-007 The referral prompt fires only for contacts at In conversation or Advocate
- Decided by: Zee, 2026-11-26, by approving the REQ-007 plan
- Words given (strategy spec 5H): "if a contact at the company is at 'In conversation' or
  above, suggest asking them before applying cold".
- Affects: REQ-007; `src/utils/company-match.ts::referralCandidates`.

### DEC-008 Invitation limits: warn at 80, stop at 100, in a rolling seven days
- Decided by: Zee, 2026-11-26, by approving the REQ-009 plan
- Words given (strategy spec 5E): "counts invitations the user marks as sent in a rolling seven
  days, warns at 80, and stops queuing at 100". The 100 figure is observed, not published by
  LinkedIn, so the UI says "about 100".
- Affects: REQ-009; `src/utils/invitation-limits.ts`.
