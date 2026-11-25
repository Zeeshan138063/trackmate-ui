# OQ-01: What happens to the code that already collects data from LinkedIn?

- **Owner:** Zee (product owner)   **Asked:** 2026-11-26   **Status:** open
- **Blocks:** REQ-008 (freshness alert, depends on job intake sources), and any work on job
  intake or the extension's LinkedIn readers

## Why it matters

The strategy spec (`docs/prd/2026-11-26-crm-strategy-spec.md`, ground rule 2 and section 9)
excludes scraping LinkedIn and warns that LinkedIn's terms cover extensions that scrape its
pages. A restricted account ends a user's search on their main channel. Three pieces of existing
code collect LinkedIn data:

| Code | What it does |
|---|---|
| `supabase/functions/fetch-linkedin-jobs/` + cron `fetch-linkedin-jobs-hourly` | Server fetches LinkedIn job search pages hourly. The cron URL has a typo in the project ref, so it may not be running |
| `supabase/functions/parse-linkedin/` | Reads a LinkedIn URL through `r.jina.ai` for resume import |
| `extension/content.js` (`_linkedInJob`, `_linkedInProfile`, `_linkedInCompany`) | Reads job, profile and company pages the user has open. It does not click or send anything |

Choices for each: remove, replace with an input the spec allows (paste text, LinkedIn's own data
export, company career-page feeds), or keep with a stated reason.

## What we built meanwhile

Nothing is changed and nothing is extended. The three areas are frozen: `spec-kit.json` warns on
new `linkedin.com` requests in edge functions, and `extension/CLAUDE.md` and
`supabase/CLAUDE.md` say not to fix or add to them. The cron typo is left as it is.

## The answer

Empty until answered.
