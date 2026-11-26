# Campaign setup

REQ-001, 2026-11-26. Implements REQ-001 (strategy spec section 5A). Used by REQ-004 and REQ-008.

## Why

JobOS did not know what the user is looking for or what rules them out of a job: target roles,
where they can work, citizenship, languages, whether they need sponsorship. Without that it
cannot flag a job the user cannot take, and the Today list's size lived only in one browser.

## Goals

- One campaign per user, saved to their account: role titles, regions, remote, citizenships,
  languages, sponsorship need, years of experience, pay floor, earliest start, daily capacity.
- The Today list takes its limit from the campaign.
- Job fit caps and fresh-job matching (REQ-008) read the campaign.

## Non-goals

- Several campaigns at once. One per user for now.
- Changing when the follow-up agent sends. Its schedule stays in Follow-up settings.
- Pay floor and start date are stored and shown but do not filter jobs yet: job posts rarely
  state them in a form that can be compared safely.
- No AI. Everything here is typed by the user.

## Acceptance criteria

- **AC-1** Table `campaigns`, one row per user, row level security on in the same migration;
  a user can read and write only their own row.
- **AC-2** Settings has a Campaign tab with every field above. Saving creates or updates the row
  and reports a failure in words.
- **AC-3** `normalizeCampaign` cleans input: lists are trimmed, de-duplicated, capped at 20
  entries; capacity is clamped to 3 to 30; invalid numbers, dates and currencies become empty or
  the default.
- **AC-4** `titleMatches(campaign, title)` is true when every word of one role title, seniority
  words aside, is in the job title. An empty campaign matches nothing.
- **AC-5** With a saved campaign, the Today list's limit is its daily capacity, and changing the
  limit on Home updates the campaign. With none, the browser number is used as before.
- **AC-6** On a database without the migration, Settings says the campaign could not be loaded
  and the rest of the app works.
- **AC-7** The campaign is in Export All Data and is removed by Delete Account.

## Design

- `src/utils/campaign.ts` (pure): `Campaign`, `normalizeCampaign`, `parseList`, `fromRow`,
  `toRow`, `titleMatches`, `campaignGaps`.
- `src/hooks/useCampaign.ts`: read and upsert.
- `src/components/Settings/CampaignSettings.tsx`: the form.
- Migration `20261126150000_campaigns.sql`.

## Risks

- Citizenship and visa need are sensitive. They stay in the user's own row behind row level
  security, are never sent to an AI provider by this feature, and go with export and delete (P9).
