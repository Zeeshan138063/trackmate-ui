# followups: the follow-up agent

The best-built part of the backend and the pattern new backend work copies. Read
`docs/FOLLOWUPS.md` before changing anything: it holds setup, the cadence rules and the security
model. This file is the rules for editing the code.

## What it owns

Tables `follow_ups`, `follow_up_events`, `followup_settings`, `mail_accounts`, `telegram_links`,
`heartbeats`; the `follow_up_transition` RPC and state trigger; the five `followups-*` edge
functions; the Follow-ups tab and settings in `src/components/followups/` and
`src/components/Settings/FollowUpSettings.tsx`.

## Layers (imports point downward only)

| Layer | Files | May import |
|---|---|---|
| Domain, pure | `cadence.ts`, `calendar.ts`, `sendWindow.ts`, `state.ts`, `validators.ts`, `cards.ts`, `prompts.ts` | each other only. No `Deno.env`, no network, no clock: time is passed in |
| Ports | `ports.ts` | domain types |
| Use cases | `services/` (`plan`, `draft`, `send`, `ingest`, `approvals`, `tick`, `deps`) | domain and ports. Never an adapter |
| Adapters | `adapters/` (`gmail`, `outlook`, `claude`, `telegram`, `supabaseRepo`, `tokens`, `mime`, `http`) | ports, vendor APIs |
| Wiring | `runtime.ts`, `security.ts`, `mod.ts`, and `functions/followups-*/index.ts` | everything |

A new vendor (another mail provider, another chat app) is a new adapter behind an existing port.
A new rule is a change to a domain file with its test. Entry points stay thin.

## Rules that must hold

- **Nothing is sent without approval.** Email goes `awaiting_approval` to `approved` to `sending`
  to `sent`. LinkedIn messages go to `awaiting_manual_send`: the user sends by hand (P1, P2).
  Never add a path that skips `awaiting_approval`.
- **State changes only through `follow_up_transition`.** The database rejects other transitions
  and logs each one in `follow_up_events`, which is append-only (P7).
- **Cadence limits are product decisions**, not tunables: at most two chasers; 6 then 8 business
  days; Tuesday to Thursday 10:00 to 14:00 in the contact's time zone; 15 emails per inbox per 24
  hours; any reply stops chasing. Changing one needs a DEC entry in `docs/plan/`.
- **Drafts cite only "Facts the agent may mention"** from settings plus the application and
  contact (P3). `validators.ts` checks drafts in code; keep new draft kinds under it.
- **Inbound mail is untrusted data.** It is passed to the model delimited, the classifier returns
  a fixed label, and the drafter has no tools. Do not give either model a tool that sends or
  writes.
- **Idempotency.** One follow-up per (application, contact, kind, attempt). Rows are leased with
  `SKIP LOCKED`. Before any send, re-check for a reply and for the message in Sent.
- **Tokens** live in Supabase Vault and are read only by service-role functions. Never return one
  to the browser, log one, or store one in a table column.
- **Callers authenticate inside the function** (`verify_jwt = false` for all five): user JWT via
  `requireUser`, the Vault shared secret for the tick, and per-provider secrets compared in
  constant time (`security.ts`).

## Tests

```bash
npm run test:followups
```

`cadence_test.ts`, `calendar_test.ts`, `state_test.ts`, `services/services_test.ts`,
`adapters/adapters_test.ts`, with in-memory fakes in `testing/fakes.ts`. A change to a rule
changes or adds a test in the same commit. Add a fake before you add an adapter call to a
service.

## Models

Defaults are set in code and overridable by `FOLLOWUPS_DRAFT_MODEL` and
`FOLLOWUPS_CLASSIFY_MODEL`. Changing a default is a deliberate change with its own line in
`CHANGELOG.md`.

## Handoff

`docs/modules/followups.md`
