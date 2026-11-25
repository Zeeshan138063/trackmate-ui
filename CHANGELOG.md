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

- Settings > Data: Export All Data downloads your data as a JSON file, and Delete Account permanently removes your data and account.

### Changed

### Fixed

- Calendar functions now check who is calling and only touch that user's calendar accounts.
- AWS keys are no longer in the browser; the resume attached to a job is stored on the job and survives a reload.
- The notification key is no longer in the browser; reminders go to the signed-in user instead of one shared inbox.
