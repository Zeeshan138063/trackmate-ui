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

- Connections: every contact has a role type and a warmth stage, shows its one next step with a due date, and the page opens on a Today list of people to act on, with snooze, filters and a do-not-contact switch.

### Changed

### Fixed
