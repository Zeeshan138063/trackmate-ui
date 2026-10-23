# Follow-up agent: setup and operations

JobOS plans follow-ups for each application, Claude drafts them, you approve each one on Telegram or in the
**Follow-ups** tab, and approved emails go out from your own Gmail or Outlook as replies in the original thread.
LinkedIn messages are handed to you to send yourself. Nothing is ever sent without your approval.

## How it fits together

| Piece | Where |
| --- | --- |
| Data model + state machine (DB trigger) | `supabase/migrations/20261024120000_followup_agent.sql` |
| RPCs, token vault, scheduler | `supabase/migrations/20261024130000_followup_agent_runtime.sql` |
| Domain logic (cadence, send window, state) | `supabase/functions/_shared/followups/*.ts` |
| Adapters (Gmail, Outlook, Claude, Telegram, Supabase) | `supabase/functions/_shared/followups/adapters/` |
| Use cases (tick, draft, send, ingest, approvals) | `supabase/functions/_shared/followups/services/` |
| Edge functions | `followups-tick`, `followups-api`, `followups-oauth`, `followups-telegram`, `followups-mail-webhook` |
| UI | `src/components/followups/*`, `src/components/Settings/FollowUpSettings.tsx` |

States: `planned → drafting → awaiting_approval → approved → sending → sent` (email) or
`awaiting_approval → awaiting_manual_send → sent` (LinkedIn). Exits: `skipped`, `cancelled` (they replied), `failed`.
The database rejects any other transition and logs every change in `follow_up_events`.

## Setup (once)

### 1. Database
```bash
supabase db push        # applies both follow-up migrations
```
Then create the two Vault secrets the scheduler reads (SQL editor):
```sql
select vault.create_secret('https://jdplobgtxzncwxhordah.supabase.co', 'followups_project_url');
select vault.create_secret('<64 random chars>', 'followups_internal_secret');   -- openssl rand -hex 32
```

### 2. Google (Gmail)
1. Google Cloud console → new project → enable **Gmail API**.
2. OAuth consent screen: External. Scopes: `gmail.send`, `gmail.readonly`.
   **Publish the app to Production.** In Testing mode Google expires refresh tokens after 7 days.
   For your own account you can stay unverified and click through the warning once. Letting other JobOS users connect
   Gmail needs Google verification plus a yearly CASA security assessment (plan a few weeks).
3. Credentials → OAuth client (Web). Redirect URI: `https://jdplobgtxzncwxhordah.supabase.co/functions/v1/followups-oauth`

### 3. Microsoft (Outlook / outlook.com)
1. Entra admin center → App registrations → New. Account types: **personal and organizational**.
2. Redirect URI (Web): same as above. Certificates & secrets → new client secret.
3. API permissions (delegated): `offline_access`, `User.Read`, `Mail.ReadWrite`, `Mail.Send`.

### 4. Telegram
1. @BotFather → `/newbot` → token. Optional: `/setprivacy` → Enable.
2. After deploying (step 6), register the webhook with a secret:
```bash
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d url=https://jdplobgtxzncwxhordah.supabase.co/functions/v1/followups-telegram \
  -d secret_token=$TELEGRAM_WEBHOOK_SECRET \
  -d 'allowed_updates=["message","callback_query"]'
```

### 5. Secrets for the edge functions
```bash
supabase secrets set \
  APP_URL=https://jobos.dev \
  FOLLOWUPS_INTERNAL_SECRET=<same value as the Vault secret> \
  OAUTH_STATE_SECRET=$(openssl rand -hex 32) \
  ANTHROPIC_API_KEY=... \
  GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
  MS_CLIENT_ID=... MS_CLIENT_SECRET=... \
  TELEGRAM_BOT_TOKEN=... TELEGRAM_BOT_USERNAME=<bot username without @> \
  TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)
```
Optional:

| Variable | Purpose |
| --- | --- |
| `ALLOWED_ORIGINS` | Extra browser origins for the API, comma-separated (e.g. `http://localhost:8080` for dev) |
| `FOLLOWUPS_DRAFT_MODEL` / `FOLLOWUPS_CLASSIFY_MODEL` | Override `claude-sonnet-5-5` / `claude-haiku-5-5` |
| `GRAPH_CLIENT_STATE` | Turns on Outlook push (instant reply detection). Random 32+ chars |
| `GMAIL_PUBSUB_TOPIC` + `GMAIL_PUSH_TOKEN` | Turns on Gmail push. Topic `projects/<p>/topics/<t>`; grant `gmail-api-push@system.gserviceaccount.com` Publisher; push subscription URL `.../followups-mail-webhook?provider=gmail&token=<GMAIL_PUSH_TOKEN>` |

Without push, every inbox is polled on each 15-minute tick, which is enough.

### 6. Deploy
```bash
supabase functions deploy followups-tick followups-api followups-oauth followups-telegram followups-mail-webhook
```
`supabase/config.toml` turns the gateway JWT check off for these five because each authenticates its caller itself.

### 7. In the app
Settings → Integrations → **Follow-up agent**: connect your inbox, connect Telegram, and fill in
**Facts the agent may mention**. The agent can only cite those lines, which keeps every message true.

For each application: link the recruiter or hiring manager under **Contacts** (with an email and/or LinkedIn URL),
set **Date Applied**, and the first follow-up is planned 6 business days later.

## Rules the cadence engine follows

- Chaser 1: 6 business days after applying. Chaser 2: 8 business days after chaser 1. Never more than two.
- Thank-you: the same business day as an interview touchpoint.
- They gave a date: check in 2 business days after it, once.
- Any reply stops chasing (out-of-office only postpones by 3 days).
- Applications older than 21 days without a chaser are not chased.
- Rejected, accepted, or 15 business days of silence after chaser 2: the contact moves to a keep-in-touch reminder in 60 to 90 days.
- Emails go out Tuesday to Thursday, 10:00 to 14:00 in the contact's time zone. Gulf weekends (Fri/Sat) are respected.
- At most 15 emails per inbox per 24 hours.

## Security model

- **Who can act**: browser calls carry the Supabase session and are verified server-side; every action re-checks that the
  follow-up belongs to the caller. A user id in a request body is never trusted.
- **Machine callers**: the scheduler uses a shared secret stored in Vault (not in the cron command). Telegram, Gmail push
  and Graph each carry their own secret, all compared in constant time. Only Telegram chats linked through a one-time,
  15-minute code can act, and only in private chats.
- **OAuth**: HMAC-signed, 10-minute `state` bound to the user, PKCE (S256), minimal scopes, granted scopes verified.
  Refresh tokens live only in Supabase Vault and are read through service-role-only functions; rotated tokens are saved.
  Disconnecting an inbox deletes its secret.
- **Database**: RLS on every new table; service RPCs are revoked from `anon` and `authenticated`; all state changes go
  through `follow_up_transition`, which whitelists the columns it may change and logs the actor.
- **Email**: header values are stripped of CR/LF (no header injection); only mail from known contacts is stored, as a
  500-character snippet.
- **LLM**: recruiter emails are passed as delimited, untrusted data; the classifier can only return a fixed label; the
  drafter has no tools that send or change anything; drafts are validated in code and approved by you.
- **Browser**: CORS limited to `APP_URL` (+ `ALLOWED_ORIGINS`); OAuth and Telegram links are host-checked before redirecting;
  errors return generic messages.
- **Duplicates**: idempotency key per (application, contact, kind, attempt), row leases with `SKIP LOCKED`, a sweeper that
  checks the Sent folder before retrying a crashed send, and a re-check for replies immediately before every send.

Known limit: after a crash mid-send, Outlook replies are matched in Sent Items by recipient and subject (Graph does not
allow a custom header on `createReply`), so a resend is possible in that rare case. Gmail uses an exact header match.

## Operating it

- Health: `select * from heartbeats;` (`followups-tick` should be under 20 minutes old).
- What happened to a follow-up: `select * from follow_up_events where follow_up_id = '...' order by at;`
- Tests: `cd supabase/functions && deno test --no-config --node-modules-dir=none --allow-read _shared/followups/`
