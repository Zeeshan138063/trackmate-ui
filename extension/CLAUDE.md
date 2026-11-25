# extension/: the JobOS browser extension

Chrome, Manifest V3, version 2.0.0, plain JavaScript, **no build step and no npm**: the files in
this folder are what gets loaded. Read the root `CLAUDE.md` first. `extension (Copy)/` next door
is a stale 1.5.1 copy: never edit it, never read it for answers.

## What it does

Reads the page the user is on, shows what it found in the popup for review, and saves it to the
user's JobOS account. On application forms it fills fields from the user's profile. The user
always reviews, and the user always clicks submit.

## Files

| File | Runs in | Role |
|---|---|---|
| `manifest.json` | | Permissions and where scripts are injected |
| `content.js` | every `https://*/*` page | `PageState` (SPA navigation and DOM changes), `JobExtractor` (per-site readers), `ATSDetector`, `ATSAutofiller` |
| `background.js` | service worker | `TabStore` (per-tab state, in memory), `Badge` (JOB, PROF, CO, FILL), screenshots, temporary hand-off storage |
| `popup.html`, `popup.js` | the popup | Sign-in, review and edit, save, autofill, import profile, session sync |
| `careerpilot-bridge.js` | the web app's pages, at `document_start` | Lets the web app fetch hand-off data and tells the extension when the app logs out |
| `supabase-js.js` | popup | Vendored Supabase client. Do not edit; replace whole when upgrading |
| `*.md` | | Older notes. `USER_ASSOCIATION_FLOW.md` and `CHANGES.md` are still accurate; treat the rest as history |

## Messages (the contract between the scripts)

Sent with `chrome.runtime.sendMessage` / `chrome.tabs.sendMessage` as `{ action, ... }`.

| Action | From, to | Purpose |
|---|---|---|
| `jobDataExtracted`, `atsDetected` | content to background | Report what the page is; sets the badge |
| `getTabState`, `getCachedData` | popup to background | Read the tab's last extraction |
| `extractJobData` (with `mode`), `detectATS`, `autofill` (with `profile`) | popup to content | Do the work on the page |
| `captureScreenshot` | popup to background | Visible-tab JPEG |
| `saveJobData`, `getSavedJobs` | popup to background | Local list in `chrome.storage.local.savedJobs` |
| `sendToCareerPilot`, `sendContactToCareerPilot`, `sendProfileToCareerPilot` | popup to background | Store the record for one hour, open the app at `/trackers`, `/connections` or `/resume` with `?action=...&dataId=...` |
| `getJobData` | bridge to background | The app collects the record by `dataId` |
| `portalLogout` | bridge to background | The app logged out: clear the extension session |

The bridge talks to the page with `window.postMessage`: the app sends
`{ source: 'careerpilot-web-app', action: 'getJobData' | 'getData' | 'ping', dataId }` and gets
`{ source: 'careerpilot-extension', action: 'dataResponse' | 'pong', ... }`.

Renaming an action, a `source` string, a URL parameter or a storage key breaks the other side
silently. Change both sides (`src/pages/Trackers.tsx`, `src/pages/Connections.tsx`,
`src/components/resume/ResumeImporter.tsx`) in the same pull request.

## Two ways data is saved

1. **Direct**: `popup.js` signs in with Supabase email and password and POSTs to
   `/rest/v1/jobs`, `/contacts` or `/dream_companies` with the user's token. RLS applies.
2. **Hand-off**: background stores the record under a random id, opens the app, and the user
   confirms in a dialog there.

Column names in the direct path are typed by hand in `saveJobDirectly`, `saveContactDirectly`
and `saveCompanyDirectly`. A migration that renames or adds a required column must update them.

## Hardcoded values

- Supabase URL, project ref and anon key in `popup.js`, `background.js`, `careerpilot-bridge.js`.
  The anon key is public; no other key may ever be added here (P4).
- The app URL comes from the popup field, saved as `careerPilotUrl`, defaulting to
  `http://localhost:8080`. The session key is `sb-<project ref>-auth-token`, the same key the web
  app uses in `localStorage`; `syncSessionToTabs` copies the session into open app tabs.

## Rules

- **Read and fill only. Never act** (P1, P2). No `.click()`, no form `.submit()`, no navigation,
  no scrolling to load more, no background fetch of a job board or of LinkedIn, no crawling
  through search results or profiles. Extraction happens on the page the user opened, and saving
  happens when the user presses Save.
- **LinkedIn is frozen** (OQ-01). The extension reads LinkedIn job, profile and company pages
  today. LinkedIn's terms cover extensions that scrape, so until OQ-01 is answered: fix nothing
  and add nothing in `_linkedInJob`, `_linkedInProfile`, `_linkedInCompany`, and add no new
  LinkedIn page types or fields.
- **Autofill uses only the user's own `profiles` row and resume** (P3). Never guess a field.
  Leave it empty and report which fields were skipped.
- **Selectors**: prefer `aria-*`, `data-*`, roles and structure over class names, which sites
  rotate. Every extractor returns the same shape with empty strings for what it could not find;
  it never throws to the popup.
- **Permissions**: `host_permissions` and the content-script matches are already broader than
  needed (`https://*/*`). Do not widen them. Narrowing them is wanted, but is its own spec
  because the generic extractor and the bridge depend on it.
- **Store little** (P9). Hand-off records expire after one hour. Do not add long-lived caches of
  other people's profile data.
- Messages that answer asynchronously must `return true` from the listener. The service worker
  can be stopped at any time: anything that must survive goes in `chrome.storage`, not `TabStore`.
- Any user-visible change bumps `version` in `manifest.json` and adds a line to `CHANGES.md` and
  the root `CHANGELOG.md`.

## Testing

No automated tests. Load the folder unpacked at `chrome://extensions` (Developer mode), reload
it after every edit, and reload the tab under test. Run the cases in
`docs/EXTENSION_TEST_CASES.md` that your change touches, in both save paths, and paste the
results in the pull request. That file still says "TrackMate" and port 5173; the app runs on 8080.

## Handoff

`docs/modules/extension.md`
