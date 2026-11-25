# OQ-##: <the question, as a question>

- **Owner:** <role who must answer>   **Asked:** YYYY-MM-DD   **Status:** open
- **Blocks:** nothing | REQ-### | a release

## Why it matters

What goes wrong with a plausible wrong answer.

## What we built meanwhile

The setting that will carry the answer, and what happens while it is unset.

```python
# billing/accounts.py
def late_fee_account(company) -> str | None:
    # OQ-07: which ledger account late fees post to is finance's decision. Unset: the fee is
    # charged and shown, but not posted, and the skip is logged. Do not pick a default.
    return company.settings.get("accounts.late_fee")
```

## The answer

Empty until answered. Then: the words given, who gave them, the date, and the `DEC-###`.
