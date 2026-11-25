# Product requirements

The **what**. Each requirement has an ID that never changes and is cited everywhere it matters:
specs, ADRs, tests and the QA coverage matrix.

## Format

```markdown
### REQ-041 Late returns are charged a fee

A rental returned after its due time is charged a late fee, shown to the customer before they pay.

- Source: product review, 2026-03-02
- Acceptance: AC lists live in the feature spec that implements this REQ
- Priority: must
```

Rules:

- One requirement, one ID. Never reuse a retired ID; mark it `Withdrawn` instead.
- Write what a user can do or must see, not how it is built.
- A requirement that cannot be tested is not finished. Rewrite it until a test could prove it.
