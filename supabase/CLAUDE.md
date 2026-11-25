# supabase/: the backend

Rules for the database and edge functions. Read the root `CLAUDE.md` first. The follow-up agent
has its own file in `functions/_shared/followups/CLAUDE.md`.

## There is one project and it is live

`config.toml` points at `jdplobgtxzncwxhordah`, which serves real users. There is no staging.

- **Do not run** `supabase db push`, `supabase functions deploy`, `supabase secrets set` or any
  SQL against the project unless Zee says so in this session. Write, show the diff, stop.
- Prefer testing a migration on a local stack (`supabase start`, `supabase db reset`) and say in
  the pull request whether that was done.

## Migrations (`migrations/`)

39 files, applied in name order, creating 27 tables.

| Area | Tables |
|---|---|
| Applications | `jobs`, `interview_feedback`, `interview_practices`, `priorities`, `career_goals`, `work_styles` |
| People and companies | `contacts`, `engagements`, `dream_companies`, `dream_company_reminders` |
| Profile and resumes | `profiles`, `resumes` |
| Job discovery (shared across users) | `job_search_queries`, `discovered_jobs` (`embedding vector(384)`), `archived_jobs` |
| Meetings | `meetings`, `availability_preferences`, `calendar_accounts` |
| Growth | `profile_growth_settings`, `content_queue`, `integration_tokens` |
| Follow-up agent | `follow_ups`, `follow_up_events`, `followup_settings`, `mail_accounts`, `telegram_links`, `heartbeats` |

Rules:

- **Never edit an applied migration** (P6). Add `YYYYMMDDHHMMSS_<what>.sql`. The December 2025
  `company_size` files show what happens otherwise: five migrations fixing one trigger.
- **Every new table**: `user_id uuid not null references auth.users`, `enable row level
  security`, and select/insert/update/delete policies on `auth.uid() = user_id`, all in the same
  file (P5). A table that is deliberately shared (like `discovered_jobs`, public read, service
  role write) says so in a comment and in the spec.
- Write migrations so they can run twice: `if not exists`, `create or replace`, `drop ... if
  exists`.
- After a schema change regenerate the app types and commit them in the same pull request:
  `npx supabase gen types typescript --project-id jdplobgtxzncwxhordah > src/integrations/supabase/types.ts`
  (this reads the live schema, so it only matches after the migration is applied: say which in
  the pull request).
- No secrets in SQL. The two hourly cron migrations embed the anon key in the command; the
  follow-up scheduler shows the right way (Vault secret read by `followups_call_tick()`).
- Functions that run as `security definer` set `search_path` and are revoked from `anon` and
  `authenticated` unless a policy needs them.

## Scheduled jobs (pg_cron)

| Job | When | Does |
|---|---|---|
| `fetch-ats-jobs-hourly` | hourly | POSTs to `fetch-jobs` |
| `archive-old-jobs-daily` | 03:00 | `archive_old_jobs()` moves old `discovered_jobs` rows to `archived_jobs` |
| `followups-tick` | every 15 min | `followups_call_tick()` calls the `followups-tick` function with a Vault secret |

## Edge functions (`functions/`)

Deno. Each folder is one function with an `index.ts`.

| Function | Caller | Does | Secrets |
|---|---|---|---|
| `fetch-jobs` | cron | Reads the public Greenhouse, Lever and Ashby feeds of watchlist companies (`dream_companies.careers_page_url`), keeps titles matching an active `job_search_queries` keyword, embeds, upserts `discovered_jobs`. Logic and tests in `fetch-jobs/feeds.ts` | `HF_TOKEN` |
| `search-jobs` | app | Embeds the phrase, calls the `match_jobs` RPC | `HF_TOKEN` |
| `perplexity-search` | app | Asks Perplexity for jobs, upserts `discovered_jobs` | `PERPLEXITY_API_KEY` |
| `manage-calendar`, `sync-calendar` | app | List calendars; sync Google and Microsoft events into `meetings` | `GOOGLE_CLIENT_ID/SECRET`, `AZURE_*` |
| `notify-reminder` | app | Sends the caller a Novu in-app reminder about one of their own jobs | `NOVU_API_KEY` |
| `followups-*` (5) | cron, app, Google/Microsoft, Telegram | The follow-up agent | see `docs/FOLLOWUPS.md` |

Embeddings: Hugging Face hosted `BAAI/bge-small-en-v1.5`, 384 dimensions. Changing the model
means re-embedding every row and changing the column; that is an ADR.

Rules for functions:

- **Authenticate the caller yourself.** Read the `Authorization` header, call
  `auth.getUser(token)`, and use that user's id. Never accept `userId` from the body (P5).
  Use `requireUserId` from `_shared/auth.ts` (or `requireUser` in `followups/runtime.ts`).
- The service role key bypasses RLS. Use it only after you know who is calling, and still filter
  by that user in every query.
- CORS: older functions answer `*`. New functions use `appCors` from `_shared/cors.ts`, which
  allows `APP_URL` plus `ALLOWED_ORIGINS`.
- Vendors sit behind a small adapter with an interface, as in `followups/adapters/`. New
  functions do not call a vendor SDK from the request handler.
- Errors returned to the browser are generic; details go to `console.error`. Never log tokens,
  message bodies or email addresses.
- A function listed in `config.toml` with `verify_jwt = false` must do its own authentication.
  Do not add one there casually.
- New secret: add it to the table in `docs/FOLLOWUPS.md` or the function's header comment, and
  tell Zee the exact `supabase secrets set` command to run. Never invent a value.
- Anything that sends, posts or submits outside JobOS needs an explicit approval step by the user
  (P2). Anything that fetches another site states in its spec why that site's terms allow it.
  Job intake uses only feeds the job boards publish for that purpose (DEC-001): no LinkedIn,
  no scraping of search results or HTML pages.
- `discovered_jobs.posted_at` is the employer's date or null. Never write "now" into it;
  `first_seen_at` records when JobOS saw the job.

## Tests

`npm run test:followups` covers only the follow-up agent. A new function with real logic puts
that logic in a pure module beside `index.ts` with a `_test.ts` file, as followups does.

## Handoff

`docs/modules/backend.md`
