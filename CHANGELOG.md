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

- Resume > Check consistency compares your Master Profile with every tailored resume and with LinkedIn text you paste, and lists any dates, titles, employers, schools or contact details that disagree.
- Jobs flags postings that rule you out (citizens only, no sponsorship, a language you do not list, far more experience than you have), showing the sentence it read. New postings from the last 48 hours that match your campaign lead your Today list.
- Settings > Campaign: say which roles you want, where you can work, your citizenships, languages, whether you need sponsorship, and how many items a day you can handle. Your Today list uses that number.
- A contact's Connection tab drafts a message from your notes about that person, with the ask matched to how well you know them (connect, advice, a call, a referral). It refuses a draft that repeats one written for someone else, and "Mark as sent" logs it in the interaction history.
- Connections tracks the LinkedIn invitations you mark as sent over the last seven days, warns you at 80 and stops suggesting new connection requests at 100.
- Before you apply somewhere you already know someone well, the job reminds you to ask them first, and the Today list says who could refer you.
- Home opens on a Today list: applications to finish, follow-ups and replies due, and people to reach out to, each with the reason it is there and Done, Snooze, Skip and Open. You set how many items a day.
- Every job, tracked or discovered, shows the contacts you already have at that company with their warmth stage, and you can link them to the job in one click.
- Connections: every contact has a role type and a warmth stage, shows its one next step with a due date, and the page opens on a Today list of people to act on, with snooze, filters and a do-not-contact switch.
- Settings > Data: Export All Data downloads your data as a JSON file, and Delete Account permanently removes your data and account.

### Changed

- Connections: search also covers email and notes, contacts can be sorted (next step due first by default), deleting asks first, adding warns about a probable duplicate, and card icons for email, phone and LinkedIn open them.

- Job discovery now reads the public job feeds of the companies on your watchlist (Greenhouse, Lever, Ashby) and no longer fetches LinkedIn or scrapes search results.
- A job with no known posting date now says "First seen" instead of "Posted", and shows its real source.

### Fixed

- Sending a profile from the Chrome extension to Connections now opens the Add Contact form with the details filled in.
- Connections no longer loads every contact's details in the background, which made the page slow with many contacts.

- Browser extension 3.1.1: jobs, contacts and profiles captured by the extension now arrive in the app with all their details, and the extension's app bridge no longer runs on unrelated sites.
- Calendar functions now check who is calling and only touch that user's calendar accounts.
- The notification key is no longer in the browser; reminders go to the signed-in user instead of one shared inbox.
- Match scores are only shown when they were actually computed; otherwise the job says "Not scored".
- The Growth page no longer says a post was published when it was not; it copies the draft and opens LinkedIn for you to post.
- Connection notes and cover letters no longer state things that are not in your profile; a failed AI call now shows an error instead of a canned note.
- A failed calendar load shows an error instead of a made-up calendar list.
