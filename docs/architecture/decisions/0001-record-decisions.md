# 0001. Decisions that bind the code are recorded as ADRs

- **Status:** Accepted (2026-01-10)
- **Cites:** all principles

## Context

The same arguments came back every few weeks, in pull requests, from people who were not in the
room the first time. A new session of Claude had no way to know a choice had been made at all, so
it proposed the rejected option with confidence.

## Options considered

| Option | For | Against |
|---|---|---|
| Decisions in chat and meeting notes | No overhead | Invisible to new people and to every new session |
| One long decisions document | One place | Grows forever; merge conflicts; hard to cite |
| One file per decision (ADR) | Citable, reviewable, dated | A little writing each time |

## Decision

Every decision that binds the code gets a numbered file in `docs/architecture/decisions/`, written
in the same pull request as the code it explains. Code comments and reviews cite it by number.

## Consequences

- Reviews point at a number instead of re-running the argument.
- Claude reads the reason before suggesting the alternative.
- Writing an ADR takes ten minutes. A decision not worth ten minutes did not need recording.
