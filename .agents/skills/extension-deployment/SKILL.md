# JobOS Extension: Store Deployment & Bundling

This skill is designed to automate the preparation and packaging of the **JobOS Chrome Extension (Manifest V3)** for the **Chrome Web Store**.

---

## 🏗 Store-Ready Walkthrough
Whenever asked to "Prepare for Store" or "Ship Build," follow these mandatory validation steps:

### 1. Versioning & Identity
- **Name Check**: Ensure `name` in `manifest.json` is: `JobOS — AI Job Tracker & Autofill`.
- **Version Check**: Pull current version from `manifest.json`.
- **Icon Integrity**: Verify `16x16`, `48x48`, and `128x128` icons exist in `/extension/icons/`.

### 2. Permissions Audit (Security Compliance)
- **ActiveTab**: Preferred over `<all_urls>` where possible.
- **Host Permissions**: 
  - Ensure `https://app.jobos.dev/*` is explicitly included.
  - Remove any `localhost:*` or `127.0.0.1` entries from host permissions for the production build.
  - Verify `scripting` and `sidePanel` are correctly configured.

### 3. Production Hardening (Cloudflare Turnstile)
- **SiteKey Update**: Verify `popup.js` uses the production SiteKey: `0x4AAAAAAAx...` (NOT the `1x0000...` dev key).
- **CSP Integrity**: Ensure `manifest.json` has the correct `content_security_policy` for Cloudflare's `https://challenges.cloudflare.com`.

### 4. Code Cleanup & Exclusions
- Remove all `console.log` statements in production scripts where they leak sensitive data.
- Ensure the `jobos-bridge.js` correctly identifies the production Supabase ID: `jdplobgtxzncwxhordah`.

---

## 🚀 Execution Commands

### Phase 1: Bump Version
Increments the version in `manifest.json`.
```bash
# Example: "Bump version to 3.1.0"
./.agents/skills/extension-deployment/scripts/bump-version.sh [major|minor|patch]
```

### Phase 2: Create Production Bundle
Cleans the environment and builds the `.zip` file for the store.
```bash
./.agents/skills/extension-deployment/scripts/bundle.sh
```

---

## 📂 Artifacts & Locations
- **Source Code**: `extension/`
- **Output Bundle**: `builds/jobos_extension_v[X.Y.Z].zip`
- **Manifest**: `extension/manifest.json`
