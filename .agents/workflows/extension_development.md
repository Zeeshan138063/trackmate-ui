---
description: Specialized rules for Chrome Extension development (Manifest V3).
---
# JobOS Extension Development Standards

To optimize performance and token usage when working with the JobOS Extension:

## 1. Extension Architecture
- **Brand**: JobOS (Chrome Web Store name).
- **Manifest**: Manifest V3 (`extension/manifest.json`).
- **Bridge Object**: `window.jobosExtension`.

## 2. Scripts
- `background.js`: Service worker.
- `content.js`: Job extraction for LinkedIn, Indeed, etc.
- `careerpilot-bridge.js`: Communicates with jobos.dev.

## 3. Storage & States
- Use `chrome.storage.local` for extension-only states.
- Sync user auth state via the bridge from the web-app's Supabase session.

## 4. Token Efficiency Tip
- **Do not read background.js in full**: Use `grep_search` to find specific event listeners.
- **Manifest Changes**: Always check `manifest.json` before adding new permissions.
