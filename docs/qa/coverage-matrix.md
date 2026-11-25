# Coverage matrix

Every requirement mapped to the test that proves it, with an honest state.

| State | Means |
|---|---|
| COVER | A test proves it, and fails if the behaviour is removed |
| RATCHET | Partly covered; the gap is written in the row |
| BLOCKED | Cannot be tested yet; the blocker is named |
| LATER | Deliberately not covered yet, with the reason |

| REQ | AC | Test | State | Note |
|---|---|---|---|---|
| REQ-041 | AC-2 | `rentals/tests/test_late_fee.py::test_per_started_hour` | COVER | |
| REQ-041 | AC-4 | `api/tests/test_return_fields.py::test_customer_sees_fee` | COVER | |
| REQ-041 | AC-1 | `e2e/return.spec.ts` | RATCHET | Runs against stubs, not the real payment provider |

A test that passes with its subject deleted is not coverage. Check by removing the behaviour once.
