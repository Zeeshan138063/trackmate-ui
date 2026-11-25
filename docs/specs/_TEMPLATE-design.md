# <Feature>

<Ticket>, YYYY-MM-DD. Implements REQ-###. Amends: <earlier spec, if any>.

## Why

Two or three sentences. The problem as a user or operator sees it today.

## Goals

- What will be true when this is done.

## Non-goals

- What this deliberately does not do, so nothing extra gets built.

## Acceptance criteria

Each one testable, each with an ID that tasks and tests point back to.

- **AC-1** A rental returned after `due_at` shows a late fee on the return screen before payment.
- **AC-2** The fee is charged per started hour at the item's hourly rate (DEC-018).
- **AC-3** The fee never exceeds one day's rate (DEC-018).
- **AC-4** A customer sees the fee; a field the customer's role may not see is absent from the response.
- **AC-5** Amounts are integer minor units end to end (P11).

## The contract change

The endpoint and fields this adds or changes, in words. The OpenAPI schema is generated from the
code; this section is for review before the code exists.

## Decisions and open questions

- Settled: DEC-018. Needs an ADR: no.
- Open: OQ-07 (ledger account). Built so the answer is configuration.

## Risks

What could go wrong, and how we will notice.
