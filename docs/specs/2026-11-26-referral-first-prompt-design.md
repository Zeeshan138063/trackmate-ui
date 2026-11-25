# Referral-first prompt

REQ-007, 2026-11-26. Implements REQ-007 (strategy spec section 5H). Builds on REQ-003 (warmth
stages) and REQ-006 (contacts at a company).

## Why

The strategy's strongest evidence is that referred candidates are hired at a far higher rate
than cold applicants. JobOS now knows who the user knows at a company and how warm each
relationship is, but nothing stops them applying cold to a company where an advocate is one
message away.

## Goals

- Before applying, the user is told when someone they are already talking to works there.
- The prompt is a suggestion with one click to the contact. It never blocks applying.

## Non-goals

- No drafting of the referral ask (REQ-005) and no ask ladder.
- No prompt for contacts below In conversation: asking a stranger for a referral is what the
  spec's ask ladder exists to prevent.
- JobOS sends nothing (P2).

## Acceptance criteria

- **AC-1** `referralCandidates(company, contacts)` is pure and returns contacts that are an
  exact company match (DEC-004), not do-not-contact, and at stage In conversation or Advocate,
  advocates first.
- **AC-2** A tracked job with status Bookmarked or Applying and at least one candidate shows a
  banner at the top of its dialog: "Ask before you apply: you know <name> (<stage>) at
  <company>", listing up to three people, each opening that contact.
- **AC-3** The banner has "Not now", which hides it for that job in this browser. It never
  appears for jobs at Applied or later.
- **AC-4** Changing such a job's status to Applied from the dialog while the banner is showing
  asks once, "Apply without asking <name> first?", with "Apply anyway" and "Ask first". Either
  choice is respected; "Apply anyway" saves as normal.
- **AC-5** In the daily queue, an application item at a company with a candidate says so in its
  reason: "<name> at <company> could refer you".
- **AC-6** Possible matches and lower stages never trigger the prompt.

## The contract change

None. No schema change, no edge function.

## Decisions and open questions

- **DEC-007** (proposed): the referral prompt only fires for contacts at In conversation or
  Advocate, the threshold the strategy spec names.

## Risks

- A wrong company match would prompt wrongly. Mitigation: exact matches only.
- A prompt on every open is nagging. Mitigation: "Not now" per job.
