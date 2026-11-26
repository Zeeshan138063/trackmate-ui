# Fit caps and fresh jobs

REQ-008, 2026-11-26. Implements REQ-008 (strategy spec section 5C). Builds on REQ-001 and REQ-004.

## Why

A found job could look like a match and still be closed to the user: citizens only, no
sponsorship, a language they do not speak, far more years than they have. The user found out
after reading the posting, or after applying. And a good posting loses value by the hour, yet
nothing told the user that a matching job had just appeared.

## Goals

- Read hard requirements out of the posting's own text and compare them with the campaign.
- Show each cap on the job with the sentence it came from.
- Put fresh jobs (48 hours) that match the campaign and have no cap at the top of the Today list.

## Non-goals

- No AI and no similarity score here. A job is "high fit" when its title is one of the
  campaign's role titles and nothing in the posting rules the user out. The semantic score on
  Jobs stays as it is.
- No cap on region, pay or start date: postings state these too loosely to compare safely.
- A cap never hides a job by itself. The user can tick "Hide jobs that rule me out".
- No new job sources (DEC-001).

## Acceptance criteria

- **AC-1** `extractConstraints(text)` finds: citizens or nationals only (with the country when
  named), no sponsorship or existing work authorisation required, required languages (not
  "nice to have"), and the highest "N years" of experience asked. Each carries the sentence.
- **AC-2** Equal-opportunity wording that mentions citizenship or national origin is not a cap.
- **AC-3** `fitCaps(constraints, campaign)`: citizenship caps when the user does not hold a
  named citizenship, or, when none is named, only if the user needs sponsorship; sponsorship
  caps only if the user needs it; a language caps only if the campaign lists languages and not
  that one; experience caps only when the campaign gives years and the posting asks for more
  than two years above them.
- **AC-4** With no saved campaign there are no caps, and Jobs links to Settings > Campaign.
- **AC-5** Jobs shows cap badges on each found job, the reasons with the posting's words in the
  job's details, and a "Hide jobs that rule me out" tick box with a count.
- **AC-6** A job is fresh for 48 hours from its posting date, or from when JobOS first saw it if
  the source gives no date. The Today item says which ("Posted" or "First seen").
- **AC-7** The Today list starts with up to three fresh high-fit jobs not already on the
  tracker (same link, or same title and company), newest first. Open goes to the posting. Done
  or Skip keeps one away for three days; Snooze works as for other items.
- **AC-8** On a database without the intake migration the fresh-job read fails quietly and the
  rest of the Today list works.

## Design

- `src/utils/job-fit.ts` (pure): `extractConstraints`, `fitCaps`, `assessFit`, `isFresh`,
  `freshHighFit`.
- `src/utils/daily-queue.ts`: `freshJobs` input, `found:<id>:fresh` items, pinned first.
- `src/hooks/useDailyQueue.ts`: reads `discovered_jobs` from the last 48 hours when a campaign
  with role titles is saved.
- `src/components/jobs/FitCaps.tsx`; used in `pages/JobSearch.tsx`.
- No migration.

## Risks

- The extractor reads English and works by pattern. It will miss some rules and can misread a
  sentence. Mitigation: caps show the sentence, never hide a job on their own, and the fresh
  list is capped at three.
