# Requirements index

The source is `2026-11-26-crm-strategy-spec.md` (Zee, 2026-11-26). This index gives the P0
features from its section 7 stable IDs so specs, tests and commits can cite them. P1 and P2
features get IDs when they are scheduled. "State today" comes from the code audit of
2026-11-26: https://claude.ai/artifact/MPeUCBWQjXVEiHDgr197DL (read on `main`; the P0 states
below were re-checked against `rebranding-jobos` and are the same there)

| ID | Requirement | Spec section | Priority | State today |
|---|---|---|---|---|
| REQ-001 | Campaign setup: role families, region, constraints, capacity; changing it changes filtering, scoring caps, send times and the daily queue | 5A | P0 | built on `jobos/campaign-setup` (not merged): one campaign per user, drives fit caps and the daily limit; send times not included |
| REQ-002 | Consistency checker across Master Profile, each CV and pasted LinkedIn text | 5B | P0 | built on `jobos/consistency-checker` (not merged): Resume > Check consistency; uploaded files are not read |
| REQ-003 | Contact records with role type, warmth stage, and one next action with a due date | 5E | P0 | partial: record, timeline, manual reminders; no stage or next action |
| REQ-004 | Daily queue sized to the user's capacity, each item with a reason, completable, snoozable, skippable | 5M | P0 | missing |
| REQ-005 | Message drafting from the user's notes about the contact; never identical across contacts | 5E | P0 | built on `jobos/message-drafting` (not merged): drafts from notes, ask ladder, duplicate check, Mark as sent |
| REQ-006 | "Who do I know here?" on every job: contacts at that company and their stage | 5C | P0 | partial: manual job-contact links only |
| REQ-007 | Referral-first prompt before applying where a contact is "In conversation" or above | 5H | P0 | missing |
| REQ-008 | Freshness alert: high-fit jobs posted in the last 48 hours go to the top of today's queue | 5C | P0 | built on `jobos/fit-caps` (not merged): caps from the posting text, fresh matching jobs lead the Today list; title and constraint match, not AI similarity |
| REQ-009 | Limits tracker: invitations marked sent in a rolling 7 days, warn at 80, stop queuing at 100 | 5E | P0 | missing |
