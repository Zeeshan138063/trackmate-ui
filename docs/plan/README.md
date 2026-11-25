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
