# Decision records (ADRs)

One file per decision: `NNNN-short-title.md`. Copy `_TEMPLATE.md`.

Write one when:

- the code goes against a principle in `../principles.md`, or
- a choice will be questioned later ("why didn't we just...?"), or
- an earlier ADR is being reversed. Then the new one says so, and the old one's status
  becomes `Superseded by ADR-####`.

An ADR is short, dated and never rewritten after it is accepted. Change your mind with a new ADR.
Claude reads these before suggesting the other way, so the reason must be in the file.
