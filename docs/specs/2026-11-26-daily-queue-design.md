# Daily queue

REQ-004, 2026-11-26. Implements REQ-004 (strategy spec section 5M). Builds on REQ-003 (contact
next actions) and the follow-up agent.

## Why

JobOS knows a lot about what is due: contact next steps, follow-ups waiting for approval,
application deadlines, applications half done. They live on four different screens, so the user
has to go looking. The strategy spec's core idea is one short, ordered list each day.

## Goals

- One list on Home, "Today", that gathers everything due from the features that exist.
- Each item says why it is there and can be done, snoozed or skipped from the list.
- The list is capped at a daily limit the user sets, so it stays doable.
- Skips are recorded, so the analytics feature can later ask "what do I keep skipping?".

## Non-goals

- No fresh high-fit job suggestions (REQ-008 needs fit scoring first), no practice task, no
  content task. The spec lists these; they join the queue when those features exist. Nothing is
  shown as a placeholder for them.
- No campaign-based capacity in hours (REQ-001). The limit is a simple number of items.
- No analytics screen. This only records the events.
- JobOS does none of the items itself (P1, P2).

## Acceptance criteria

- **AC-1** `buildDailyQueue(input, today, limit)` is a pure function returning ordered items,
  each with `key`, `group`, `title`, `reason`, `dueDate`, and a `hiddenCount` for what the limit
  cut off.
- **AC-2** Sources and groups, in display order:
  1. **Applications**: tracked jobs with status Applying ("Finish your application"), and
     Bookmarked jobs whose deadline is within 3 days ("Deadline in N days").
  2. **Follow-ups and replies**: follow-up agent messages awaiting approval or manual send;
     jobs whose follow-up date is today or past; contact actions of kind reply, thank-you,
     reminder, follow-up.
  3. **People**: contact actions of kind follow, engage, connect, ask for advice, check in,
     keep in touch, when due.
- **AC-3** Within a group, most overdue first. Across groups, the limit is filled group by
  group in the order above, except that every group with items gets at least one slot, so a
  long applications list cannot hide every person.
- **AC-4** An item skipped today, or snoozed until a later date, is not in the list. A
  completed item is not in the list for the rest of the day.
- **AC-5** The same item never appears twice (a contact with a reminder appears once).
- **AC-6** Home shows the Today card first. Each row: title, reason, a group label, and
  buttons Done, Snooze (1, 3, 7 days) and Skip, plus Open, which goes to the job or contact.
- **AC-7** The daily limit defaults to 10, can be set from 3 to 30 on the card, and is
  remembered per browser.
- **AC-8** Done, Snooze and Skip write a row to `daily_queue_events`. If that fails the item
  stays and an error is shown (P10).
- **AC-9** Before the migration is applied the list still shows; only Done, Snooze and Skip
  fail, with an error.
- **AC-10** A user can read and write only their own queue events (P5).
- **AC-11** With nothing due the card says so. It never invents items.

## The contract change

One new table:

| `daily_queue_events` | |
|---|---|
| `id` | uuid primary key |
| `user_id` | uuid not null, references `auth.users` on delete cascade |
| `item_key` | text not null, for example `contact:<id>:reply` or `job:<id>:deadline` |
| `item_group` | text not null: `applications`, `followups`, `people` |
| `action` | text not null: `done`, `snoozed`, `skipped` |
| `effective_until` | date not null: the item stays hidden through this date |
| `created_at` | timestamptz not null default now() |

RLS on, policies for select and insert on `auth.uid() = user_id`. No update or delete: the log
is append-only (P7). It is added to the account export and delete lists (P9).

## Decisions and open questions

- **DEC-005** (proposed): the queue only shows items from features that exist. Missing
  sources are left out, not faked.
- **DEC-006** (proposed): the daily limit is a number of items stored in the browser until
  campaign capacity (REQ-001) replaces it.
- "Done" on a contact item opens the log-interaction dialog, because logging is what moves the
  relationship forward; "Done" on a job item only hides it for today.

## Risks

- Home loads more data (contacts, interactions, reminders, agent follow-ups, events). All are
  small per-user reads; watch the load time.
- A limit in the browser is lost on a new device. Accepted until REQ-001.
