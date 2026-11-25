# <Term>: the definition

- **Owner:** <role who owns the meaning>   **Signed off by:** <role>   **Date:** YYYY-MM-DD
- **Cites:** REQ-###, DEC-###
- **Status:** draft | decided and built

## In the owner's words

> Quote them exactly.

## The definition

| Term | Means | The one function |
|---|---|---|
| Overdue | Not returned by `due_at`, measured in the rental company's time zone | `rentals/terms.py::is_overdue` |
| Days overdue | Whole days since `due_at`, counting a started day as one | `rentals/terms.py::days_overdue` |

## Choices we had to make

Where the words left a gap, the choice and who made it. Each one names the line that changes if
the owner decides differently.

## Where it is read

Every field, screen and export that shows this term, so a change can be traced.
