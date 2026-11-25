# Changelog

What reached the main branch, one line per pull request, in the order they merged.

## How to add an entry

Every pull request that changes code adds its own line under `## Unreleased`, in the same pull
request, at the end of `Added`, `Changed` or `Fixed`:

    - TICKET-123: what changed, in plain words

Write it for a reader outside the team. A docs-only pull request needs no entry. The
`changelog-gate` hook refuses to create or merge a code pull request without one.

When a release ships, rename `## Unreleased` to the release date and start a new one above it.

## Unreleased

### Added

- Home opens on a Today list: applications to finish, follow-ups and replies due, and people to reach out to, each with the reason it is there and Done, Snooze, Skip and Open. You set how many items a day.

- Every job, tracked or discovered, shows the contacts you already have at that company with their warmth stage, and you can link them to the job in one click.

- Connections: every contact has a role type and a warmth stage, shows its one next step with a due date, and the page opens on a Today list of people to act on, with snooze, filters and a do-not-contact switch.
- Settings > Data: Export All Data downloads your data as a JSON file, and Delete Account permanently removes your data and account.

### Changed

- Job discovery now reads the public job feeds of the companies on your watchlist (Greenhouse, Lever, Ashby) and no longer fetches LinkedIn or scrapes search results.
- A job with no known posting date now says "First seen" instead of "Posted", and shows its real source.
- Browser extension 2.0.1: renamed to JobOS, opens app.jobos.dev by default, and its app bridge no longer runs on unrelated sites.

### Fixed

- Match scores are only shown when they were actually computed; otherwise the job says "Not scored".
- The Growth page no longer says a post was published when it was not; it copies the draft and opens LinkedIn for you to post.
- Connection notes and cover letters no longer state things that are not in your profile; a failed AI call now shows an error instead of a canned note.
- A failed calendar load shows an error instead of a made-up calendar list.
- Calendar functions now check who is calling and only touch that user's calendar accounts.
- AWS keys are no longer in the browser; the resume attached to a job is stored on the job and survives a reload.
- The notification key is no longer in the browser; reminders go to the signed-in user instead of one shared inbox.
