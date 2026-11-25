# extension/: the JobOS browser extension

Chrome, Manifest V3, version 3.1.0, plain JavaScript, **no build step and no npm**: the files in
this folder are what gets loaded. Read the root `CLAUDE.md` first. Older notes for this folder
are in `.agents/workflows/extension_development.md` and `extension_testing.md`; store packaging
is the `.agents/skills/extension-deployment` skill.

## What it does

Reads the page the user is on, shows what it found in a side panel for review, and saves it to
the user's JobOS account. On application forms it fills fields from the user's profile. The user
always reviews, and the user always clicks submit.

## Files

| File | Runs in | Role |
|---|---|---|
| `manifest.json` | | Permissions and where scripts are injected. The toolbar button opens the side panel |
| `content.js` | every `https://*/*` page | `PageState` (SPA navigation and DOM changes), `JobExtractor` (per-site readers), `ATSDetector`, `ATSAutofiller` |
| `fab.js` | every `https://*/*` page, with `content.js` | Floating JobOS button in a Shadow DOM; clicking it asks the background to open the side panel |
| `skills-db.js` | side panel | Keyword list used to show "Top skills" for a captured job. Local only |
| `background.js` | service worker | Opens the side panel, `TabStore` (per-tab state, in memory), badge, screenshots, temporary hand-off storage, session sync |
| `popup.html`, `popup.js` | the side panel | Sign-in, review and edit, save, autofill, import profile |
| `jobos-bridge.js` | at `document_start` | Meant for the web app's pages: hand-off data, login and logout sync. Today it is injected on every https page |
| `supabase-js.js` | side panel | Vendored Supabase client. Do not edit; replace whole when upgrading |
| `*.md` | | Older notes; treat as history |

## Messages (the contract between the scripts)

Sent with `chrome.runtime.sendMessage` / `chrome.tabs.sendMessage` as `{ action, ... }`.

| Action | From, to | Purpose |
|---|---|---|
| `jobDataExtracted`, `atsDetected` | content to background | Report what the page is; sets the badge |
| `getTabState`, `getCachedData` | panel to background | Read the tab's last extraction |
| `extractJobData`, `detectATS`, `autofill` | panel to content | Do the work on the page |
| `openNativeSidePanel`, `closeJobOsSidebar` | fab to background | Open or close the side panel |
| `captureScreenshot` | panel to background | Visible-tab JPEG |
| `saveJobData`, `getSavedJobs`, `checkSavedJob`, `jobSavedEvent` | panel and content to background | Local saved-jobs list and "already saved" state |
| `sendToJobOS`, `sendContactToJobOS`, `sendProfileToJobOS` | panel to background | Store the record for one hour, open the app at `/trackers`, `/connections` or `/resume` with `?action=...&dataId=...` |
| `getJobData` | bridge to background | Fetch a stored record by `dataId` |
| `portalLogin`, `portalLogout` | bridge to background | The app signed in or out: copy or clear the session |

## The app hand-off is broken today

The web app asks for hand-off data with
`window.postMessage({ type: 'CAREERPILOT_FETCH_JOB_DATA', dataId })` and waits for
`type: 'CAREERPILOT_JOB_DATA_RESPONSE'` (`src/pages/Trackers.tsx`, `src/pages/Connections.tsx`,
`src/components/resume/ResumeImporter.tsx`). The bridge listens for
`{ source: 'jobos-web-app', action: 'getJobData' }` and answers with
`{ source: 'jobos-extension', action: 'dataResponse' }`. Neither side hears the other, so the app
times out and uses only the short values in the URL. Fix both sides in one pull request and
test by hand; do not rename one side alone.

## Two ways data is saved

1. **Direct**: the panel signs in with Supabase and POSTs to `/rest/v1/jobs`, `/contacts` or
   `/dream_companies` with the user's token. RLS applies. Column names are typed by hand in
   `popup.js`; a migration that renames or adds a required column must update them.
2. **Hand-off**: background stores the record under a random id, opens the app, and the user
   confirms in a dialog there (see the section above).

## Hardcoded values

- Supabase URL, project ref and anon key. The anon key is public; no other key may ever be
  added here (P4).
- The app URL is `https://app.jobos.dev` in `popup.js`. `background.js::baseUrl` still falls
  back to `http://localhost:8080` when no URL is passed.

## Rules

- **Read and fill only. Never act** (P1, P2). No `.click()` on the page, no form `.submit()`, no
  navigation, no scrolling to load more, no background fetch of a job board or of LinkedIn, no
  crawling through search results or profiles. Extraction happens on the page the user opened,
  and saving happens when the user presses Save.
- **LinkedIn is frozen** (OQ-01). The extension reads LinkedIn job, profile and company pages and
  draws its floating button on them. LinkedIn's terms cover extensions that scrape or change the
  appearance of its pages, so until OQ-01 is answered add no new LinkedIn page types or fields.
- **Autofill uses only the user's own `profiles` row and resume** (P3). Never guess a field.
- **Selectors**: prefer `aria-*`, `data-*`, roles and structure over class names. Every
  extractor returns the same shape with empty strings for what it could not find.
- **Permissions**: `<all_urls>` and `https://*/*` are broader than needed. Do not widen them.
  Narrowing is its own spec because the generic extractor and the floating button depend on it.
- **Store little** (P9). Hand-off records expire after one hour.
- Messages that answer asynchronously must `return true` from the listener. The service worker
  can be stopped at any time: anything that must survive goes in `chrome.storage`.
- Any user-visible change bumps `version` in `manifest.json` and adds a line to `CHANGES.md` and
  the root `CHANGELOG.md`.

## Testing

No automated tests. Load the folder unpacked at `chrome://extensions`, reload it after every
edit, and reload the tab under test. Run the cases in `docs/EXTENSION_TEST_CASES.md` and
`.agents/workflows/extension_testing.md` that your change touches, and paste the results in the
pull request.

## Handoff

`docs/modules/extension.md`
