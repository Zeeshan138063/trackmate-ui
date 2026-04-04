# JobOS AI Extension — v2.0 Changes

## What Was Rebuilt & Why

---

## `content.js` — Complete Rewrite

### Added: ATS Detector (new class `ATSDetector`)
Detects which Applicant Tracking System is running on the current page using 3 cascaded strategies:

1. **URL pattern matching** — fastest, covers named ATS domains (Workday, Greenhouse, Lever, iCIMS, SmartRecruiters, Workable, Taleo, Rozee.pk, Naukri)
2. **DOM fingerprinting** — catches companies on custom domains (e.g. `amazon.jobs` runs Workday underneath) by looking for ATS-specific HTML attributes
3. **Script-tag sniffing** — detects injected ATS JavaScript files as final fallback

### Added: ATS Autofiller (new class `ATSAutofiller`)
One-click form fill for all major ATS platforms:

| ATS | Detection trigger | Fields filled |
|-----|-------------------|---------------|
| Workday | `data-automation-id` attrs | Name, email, phone, city, LinkedIn, GitHub, resume upload |
| Greenhouse | `#application_form` / field names | Name, email, phone, location, LinkedIn, GitHub, portfolio, resume, cover letter |
| Lever | `data-lever-key` / field names | Name, email, phone, location, LinkedIn, GitHub, portfolio, resume |
| iCIMS | DOM id pattern | Name, email, phone |
| SmartRecruiters | `data-qa` attrs | Name, email, phone, location |
| Workable | `data-ui` attrs | Name, email, phone, LinkedIn |
| Taleo | DOM id pattern | Name, email, phone |
| Rozee.pk | Field names | Name, email, mobile, city |
| Naukri | Placeholder text | Name, email, phone |
| Generic fallback | Semantic label matching | All of the above across ~85% of any form |

**React/Vue/Angular compatibility**: Uses native value setters + synthetic event dispatch so framework state updates correctly.

**Resume upload**: Downloads PDF from JobOS URL and injects it via `DataTransfer` API — this means the tailored resume (specific to the job) is attached, not just a generic resume.

### Improved: All Job Board Extractors
- **Rozee.pk** — new dedicated extractor (position, company, location, salary, date posted)
- **Naukri** — new dedicated extractor
- **Workday** — new dedicated extractor (for Workday job listing pages, not just form pages)
- **Glassdoor** — switched to `data-test` attributes instead of hashed class names (more stable)
- **LinkedIn** — improved profile & company extractors, cleaner location parsing
- **Generic** — better heuristics, ignores nav/menu elements, cleans up HTML properly

### Improved: Auto-detection on page load
Content script now correctly reports:
- `atsDetected` → background updates badge to yellow `FILL` 
- `jobDataExtracted` → background updates badge to green `JOB`

---

## `background.js` — Major Cleanup

### Improved: Badge system
All badge logic centralized in `Badge` helper. New badge states:
- `JOB` (green) — job listing page
- `PROF` (blue) — LinkedIn profile
- `CO` (purple) — company/school page  
- `FILL` (amber) — ATS application form detected

### Improved: Data storage
- `storeTemp(id, data)` helper — stores data + schedules auto-cleanup in one call
- `buildSafeParams()` helper — always builds URL-safe params (never includes description/screenshot)
- All URL building centralized, no more repeated truncation logic

### Added: Handles `atsDetected` message
When content script detects ATS, background updates the badge immediately.

### Fixed: Message handler returns
All handlers now explicitly `return false` for unhandled messages, preventing Chrome from keeping channels open unnecessarily.

---

## `popup.js` — Major Additions

### Added: Autofill flow
1. User visits an ATS application page
2. Content script detects ATS → sends `atsDetected` message
3. Popup shows amber banner: "ATS detected: Greenhouse — Autofill available"
4. "⚡ Autofill This Form" button appears
5. User clicks → popup fetches profile from Supabase `profiles` table
6. Sends profile to content script via `autofill` message
7. `ATSAutofiller.fill()` runs → all fields filled in ~1 second

### Added: ATS detection on popup open
When popup opens, immediately sends `detectATS` to content script and shows banner if found.

### Improved: Auth UX
- Enter key on email field → focus password
- Enter key on password field → submit login
- Auto-extract after login (500ms delay)
- Better error messages

### Improved: Code structure
- `_getToken()` / `_post()` helpers → DRY API calls
- `_showOnly()` / `_setVal()` → DRY display logic
- All `document.getElementById()` calls via `el()` shorthand

---

## `popup.html` — Visual Improvements

### Added: ATS Banner
Amber banner below header shown when ATS form is detected. Shows ATS name.

### Added: "Autofill" button
Amber `⚡ Autofill This Form` button (hidden by default, shown when ATS detected).

### Improved: Layout
- Field rows (salary min/max, datePosted/deadline side by side)
- Uppercase labels with letter-spacing for readability
- Better button hover/active states
- Contact photo centered properly
- Footer with version badge

---

## `jobos-bridge.js` — Minor Improvements

### Added: `ping` / `pong`
Web app can verify extension is installed by sending `{ source: 'jobos-web-app', action: 'ping' }`.

### Added: Generic `getData` alias
Both `getJobData` and `getData` action names work — future-proofing for when contacts/companies also use the bridge.

### Improved: Error handling
All `chrome.runtime.sendMessage` calls properly handle `chrome.runtime.lastError`.

---

## `manifest.json` — Additions

### Added: New content script matches
- `https://www.rozee.pk/*`
- `https://www.naukri.com/*`
- `https://pk.indeed.com/*` (Pakistan Indeed)
- `https://www.linkedin.com/school/*`
- `https://*.myworkdayjobs.com/*`
- `https://*.icims.com/*`
- `https://jobs.smartrecruiters.com/*`
- `https://apply.workable.com/*`
- `https://*.taleo.net/*`

### Added: `notifications` permission
For future: notify user when autofill completes or save succeeds even if popup is closed.

### Added: Icons section
Proper icon paths (use `create-icons.html` to generate).

---

## Installation

1. Generate icons: open `create-icons.html` in browser → download → move to `icons/`
2. Load extension in `chrome://extensions` → Developer mode → Load unpacked
3. Navigate to a job page → extension auto-detects mode
4. Navigate to an ATS apply page → amber banner appears → click Autofill

## ATS Autofill — Profile Schema

The autofiller reads from your `profiles` table in Supabase. Required columns:

```
first_name, last_name, email, phone, location, city,
linkedin_url, github_url, website_url / portfolio_url,
resume_pdf_url (optional — URL to pre-generated tailored PDF)
```
