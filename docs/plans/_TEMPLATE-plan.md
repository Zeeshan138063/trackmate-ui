# Plan: <feature>

Spec: `docs/specs/YYYY-MM-DD-<feature>-design.md`. Approved by: <name>, YYYY-MM-DD.

## Tasks

Small, ordered, each testable on its own. Every task names the criteria it serves. A task with no
AC is out of scope; an AC with no task is a gap.

| # | Task | Serves | Test first |
|---|---|---|---|
| T1 | `rentals/terms.py::late_fee_minor` from due time, return time and hourly rate | AC-2, AC-3, AC-5 | `test_late_fee.py` |
| T2 | `late_fee` on the return serializer, field-gated | AC-1, AC-4 | `test_return_fields.py` |
| T3 | Export OpenAPI, regenerate the web client | AC-1 | drift gate |
| T4 | Return screen shows the fee from the generated type | AC-1, AC-4 | `return-screen.test.tsx` |

## Files

What each task touches.

## How we will know it is done

The evidence table each AC needs, filled in at the end.
