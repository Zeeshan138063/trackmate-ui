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

## Open questions: `OQ-##`

A question someone outside engineering must answer. See `questions/README.md`: each one is also
restated in the repo where the code depends on it, so the repo is enough on its own.
