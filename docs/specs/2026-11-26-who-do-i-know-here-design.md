# "Who do I know here?" on every job

REQ-006, 2026-11-26. Implements REQ-006 (strategy spec section 5C). Builds on REQ-003
(`2026-11-26-contact-stages-next-actions-design.md`): it shows each contact's warmth stage.

## Why

Referred candidates are hired at a far higher rate than cold applicants, but today a job in
JobOS shows a contact only if the user linked that person to that job by hand. A user looking at
a role cannot see that they already know two people at the company.

## Goals

- Every job, tracked or discovered, shows the user's contacts at that company with their stage.
- One click links a matched contact to a tracked job.
- Matching is honest: a certain match and a possible match are shown differently.

## Non-goals

- No referral prompt before applying (REQ-007) and no drafting (REQ-005).
- No LinkedIn lookups or imports. Matching uses only contacts already in JobOS (P1, P9).
- No schema change, no edge function.
- No fuzzy or AI matching.

## Acceptance criteria

- **AC-1** `contactsAtCompany(company, contacts)` is a pure function returning matches, each
  marked `exact` or `possible`, ordered by warmth stage (Advocate first), then name.
- **AC-2** Names are compared after normalising: case, punctuation, a leading "the", and legal
  and generic suffixes (Inc, LLC, Ltd, Limited, GmbH, Corp, Corporation, Co, PLC, Pvt, Private,
  Group, Holdings, Technologies, Technology) are ignored. "Acme, Inc." equals "ACME".
- **AC-3** `exact`: the normalised names are equal. `possible`: one name's words are the leading
  words of the other ("Google" and "Google Cloud"). Nothing else matches: "Meta" does not match
  "Metabase", and an empty company matches nothing.
- **AC-4** Do-not-contact contacts are listed last, marked, and never counted in a badge.
- **AC-5** In a tracked job's dialog, the Contacts tab shows "People you know at <company>":
  name, position, stage badge, exact or possible, and "Link to this job" for contacts not yet
  linked. Linking uses the existing job-contact link.
- **AC-6** The tracker table and kanban card show a small "N contacts" marker when at least one
  exact, contactable match exists.
- **AC-7** A discovered job in Job Search shows the same marker in the list and the people, with
  stages, in its detail dialog.
- **AC-8** With no matches nothing is shown in lists; the dialog says "No contacts at <company>
  yet".
- **AC-9** Only the signed-in user's contacts are ever used (existing RLS, P5).

## The contract change

None. Reads `contacts` rows the page already loads.

## Decisions and open questions

- **DEC-004** (proposed): `possible` matches are shown but never counted in the marker, so a
  number on a job is always people definitely at that company.
- Needs an ADR: no.

## Risks

- Company names are typed by hand, so some real matches will be missed ("FB" and "Meta").
  Mitigation: possible matches, and the manual link still exists.
- A common leading word could over-match as `possible` ("National Bank" and "National Grid" do
  not match, but "National" alone would match both). Mitigation: possible matches are labelled
  and never counted.
