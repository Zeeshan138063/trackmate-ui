# Docs

Where the project's knowledge lives. Code rules live in the `CLAUDE.md` files (root, plus one per
module); this tree holds what we are building, why, how, what we decided and where the work stands,
so any session, a person or a fresh Claude, can pick up cold.

## The paper trail, and the IDs that tie it together

| Folder | Holds | Cite as |
|---|---|---|
| `prd/` | The product requirements: **what** we build | `REQ-###` |
| `plan/` | The living plan: **why**, scope and order; decisions and open questions | `DEC-###`, `OQ-##` |
| `architecture/` | How it is built: the principles and the shape of the system | `P1` to `P12`, `§` |
| `architecture/decisions/` | One file per decision that binds the code | `ADR-####` |
| `definitions/` | Business terms written once, each answered by one function | `DEF-<term>` |
| `questions/` | Questions that are open **on purpose**, restated where the code depends on them | `OQ-##` |
| `specs/` | One design spec per feature: why, goals, acceptance criteria | `AC-#` inside |
| `plans/` | The build plan for a spec: tasks that point at AC IDs | |
| `modules/` | Per-module handoffs, plus `STATUS.md`: where the work stands | |
| `context/` | Dated context drops that bring a session up to speed | |
| `runbooks/` | What to do when something is wrong in production, symptom first | |
| `qa/` | What QA found, and the matrix from each REQ to the test that proves it | |

## Resuming work on a module

1. `modules/STATUS.md` for the board.
2. `modules/<module>.md` for status, decisions and the **Next step**.
3. The context drop it links to.
4. The module's own `src/<module>/CLAUDE.md`.

Update the handoff and `STATUS.md` before you finish. A stale handoff is worse than none.

## When two documents disagree

Prefer the newest dated section, and name the file and date you took the answer from.
