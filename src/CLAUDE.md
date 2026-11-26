# src/: the CRM web app

Rules for the React app served at app.jobos.dev. Read the root `CLAUDE.md` first for the workflow
and principles P1 to P10. This file is what is true inside `src/`.

## Stack

Vite 5, React 18, TypeScript (not strict: `strict`, `noImplicitAny` and `strictNullChecks` are
off), Tailwind, shadcn/ui on Radix, React Router 6, Supabase JS, Vercel AI SDK (`ai`,
`@ai-sdk/*`), `@hello-pangea/dnd` for kanban, Recharts, `pdfjs-dist` and `mammoth` for resume
import. Import alias: `@/` is `src/`. Dev server: port 8080. The project began in Lovable.

## Map

| Folder | Holds |
|---|---|
| `App.tsx` | Every route. All but `/auth`, `/jobs`, `/jobs/:keyword`, `/job-view/:jobId` are wrapped in `ProtectedRoute` + `Layout` |
| `pages/` | One file per route. `Trackers.tsx` (applications) and `Connections.tsx` (contacts) also receive data from the extension |
| `components/` | Feature components, grouped by feature folder for newer work (`followups/`, `meetings/`, `dream-companies/`, `resume/`, `Settings/`, `Growth/`) |
| `components/ui/` | 50 shadcn primitives. Generated: restyle through Tailwind tokens, do not hand-edit logic |
| `hooks/` | Data hooks, one per table family: `useJobs`, `useContacts`, `useEngagements`, `useFollowUps`, `useJobFollowUps`, `useResume`, `usePriorities`, `useCareerGoals`, `useInterviewFeedback`, plus `useAuth` |
| `services/` | Objects that wrap a table or an edge function: `JobService`, `QueryService`, `MeetingService`, `dreamCompanies`, `GrowthEngine`, `AIGenerator`, `NovuService` |
| `types/` | App-side types in camelCase (`Job`, contact, engagement, followup, meeting, resume, interview) |
| `integrations/supabase/` | `client.ts` (the one Supabase client) and `types.ts` (generated database types) |
| `utils/` | `ai-helper.ts`, `resume-ai-helper.ts`, `ai-providers/registry.ts`, file and PDF parsing, `search-intelligence.ts` |
| `lib/` | `resumeFiles.ts` (resume attachments in the private `resumes` bucket), `resumePdf.ts`, `followupHints.ts`, `utils.ts` |
| `data/mock-jobs.ts` | Mock data. Never ship it as real results |

Sidebar entries are in `components/AppSidebar.tsx`. `/interview`, `/interview-feedback` and
`/work-styles` are routed but commented out of the sidebar.

## How data flows

- **One client.** Import `supabase` from `@/integrations/supabase/client`. Never call
  `createClient` again and never use raw `fetch` against `/rest/v1`.
- **Rows are snake_case, the app is camelCase.** Each hook maps between them by hand (see
  `useJobs.tsx`). When you add a column, update the migration, `integrations/supabase/types.ts`,
  the type in `types/`, and both directions of the mapping in the hook. Missing one direction is
  the most common bug here.
- **Always filter by the user** (`.eq('user_id', user.id)`) and set `user_id` on insert. RLS is
  the real fence (P5); the filter keeps queries fast and intent obvious.
- **Server state.** Most hooks use `useState` + `useEffect` and refetch by hand; only 5 files use
  TanStack Query. For a new hook use TanStack Query (`useQuery` / `useMutation` with
  invalidation). Do not convert an old hook as a side effect of another change.
- **Edge functions** are called with `supabase.functions.invoke('<name>', { body })`, which sends
  the user's session. Never put a user id in the body for the function to trust (P5).
- **Job status** is a fixed set: Bookmarked, Applying, Applied, Interviewing, Negotiating,
  Accepted, Rejected. The kanban, stats and follow-up planner all depend on these exact strings.

## AI calls

Text generation runs in the browser with the user's own key. `utils/ai-providers/registry.ts`
builds the model from `localStorage`: `AI_PROVIDER` (gemini by default, openai, deepseek,
huggingface, openrouter), `<PROVIDER>_API_KEY`, `<PROVIDER>_MODEL_NAME`.

- Go through `AIHelper`, `ResumeAIHelper` or `AIGenerator`. Do not build a model inline.
- Handle "no key configured" with a message that points to Settings. Never fall back silently.
- Prompts that write resumes, cover notes or messages must state that only supplied facts may be
  used, and must pass the Master Profile as the only source (P3).
- JobOS's own keys (Anthropic, Perplexity, Hugging Face) live in edge function secrets, never
  here (P4).

## Extension hand-off

`Trackers.tsx`, `Connections.tsx` and `components/resume/ResumeImporter.tsx` read
`?action=addJob|addContact|importProfile&dataId=...` from the URL, then ask the extension for the
record with `window.postMessage({ type: 'CAREERPILOT_FETCH_JOB_DATA', dataId })` and wait for
`type: 'CAREERPILOT_JOB_DATA_RESPONSE'`, which `extension/jobos-bridge.js` sends (extension
3.1.1 and later). With an older extension, or none, the request times out and only the short
values in the URL are used. The strings are a contract: change both sides in one pull request
and test by hand.

## UI rules

- Use the shadcn components in `components/ui/` and Tailwind tokens. Both themes must work
  (`next-themes`, dark is the default). No hard-coded hex colours.
- Two toast systems exist (`hooks/use-toast` and `sonner`). Use `sonner` in new code.
- Every screen that loads data shows loading, empty and error states. A failed save shows an
  error; it never looks like success (P10).
- New route: add it in `App.tsx` above the `*` route, inside `ProtectedRoute` + `Layout` unless a
  spec says it is public, and add the sidebar entry.
- Dialog files are already too large (`EditJobDialog.tsx` is 1,240 lines). New features go in
  their own feature folder with small components, not into those files.

## Do not touch without a spec

`GrowthEngine.publishToLinkedIn` is a known problem listed in the root `CLAUDE.md`. Do not add
callers and do not patch around it in passing.

## Tests

`npm test` runs vitest over `src/**/*.test.ts` in a Node environment (no DOM). Pure logic goes in
plain functions in `utils/` with a test beside it; `utils/contact-next-action.ts` is the
reference: no clock, no network, time passed in. Components are not unit-tested yet, so the plan
for a UI change lists the manual checks.

## Contacts (REQ-003)

- A contact's next step is computed, never stored: `nextAction()` in
  `utils/contact-next-action.ts`, fed by `hooks/useContactActions.ts`. Change a rule there and in
  its test, nowhere else. Timings live in `RULES` (DEC-003).
- Stages change only on a user click (DEC-002). `suggestedStage()` proposes; never auto-apply it.
- Do-not-contact is `contacts.relationship_stage = 'do_not_contact'`, the field the follow-up
  agent checks. Do not add a second flag.
- Next steps are prompts. Nothing here may act on LinkedIn or send anything (P1, P2).
- The daily queue on Home is `buildDailyQueue()` in `utils/daily-queue.ts`, fed by
  `hooks/useDailyQueue.ts`. A new kind of due item is a new branch in `collectItems()` with a
  stable `key` and a test. Only real data goes in: no placeholder items (DEC-005). What the user
  did with an item is appended to `daily_queue_events`, never updated.
- The campaign (`utils/campaign.ts`, `hooks/useCampaign.ts`, table `campaigns`, one row per
  user) is what the user wants and what rules a job out. Read it through `useCampaign()`; clean
  anything going in with `normalizeCampaign()`. Citizenship and visa need never go into an AI
  prompt.
- Fit caps: `utils/job-fit.ts` reads hard requirements from a posting (`extractConstraints`) and
  compares them with the campaign (`fitCaps`). Every cap carries the posting's sentence. A new
  kind of cap is a new pattern plus tests for a true case and a look-alike that must not match
  (DEC-010). Fresh matching jobs enter the queue through `freshHighFit()`.
- Message drafts: `utils/message-draft.ts` picks the ask (`availableAsks`, DEC-009), builds the
  prompt from the user's notes and checks the result (`checkDraft`). `AIGenerator.draftMessage`
  only calls the model. A new rule for drafts goes in `checkDraft` with a test, not in the prompt
  alone. JobOS never sends the message (P2).
- Invitation limits: `invitationUsage()` in `utils/invitation-limits.ts` counts
  `contacts.invitation_sent_at` over seven days (DEC-008). The date is set only by the user's
  "Mark invitation sent" click; JobOS never reads or sends invitations on LinkedIn (P1).
- The referral-first prompt uses `referralCandidates()` (exact match, In conversation or Advocate,
  DEC-007) and never blocks applying: it reminds, the user decides.
- "Who do I know at this company" is `contactsAtCompany()` in `utils/company-match.ts`, shown by
  `components/contacts/KnownContacts.tsx`. A number on a job counts exact, contactable matches
  only (DEC-004). Match on the user's own contacts; never look a company or person up elsewhere.

## Handoff

`docs/modules/web-app.md`
