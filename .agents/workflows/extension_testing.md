---
description: Specialized rules for testing the CareerPilot Extension (LinkedIn, Indeed, iCIMS).
---
// turbo-all

# JobOS Extension Testing Protocol

Use this workflow to verify the JobOS Extension's core logic. 

## 1. Environment Setup
- **App URL**: `jobos.dev` or `localhost`.
- **Extension**: Load from `/extension` folder as an unpacked extension.
- **Login**: Must be logged into the JobOS web app to sync the auth session.

## 2. Core Test Missions (LinkedIn)

### 💼 Mission: Save Job
- **Target**: LinkedIn job posting.
- **Verify**: "Extract Job Data" button appears.
- **Expectation**: "Save Job" opens JobOS with the data pre-filled.

### 👤 Mission: Save Contact
- **Target**: LinkedIn personal profile.
- **Verify**: "Extract Contact" button is visible.
- **Expectation**: Direct save to your JobOS "Connections" tracker.

### 🏢 Mission: Save Company
- **Target**: `https://www.linkedin.com/company/[name]/`
- **Verify**: "Extract Company" button is visible.
- **Expectation**: Direct saving to "Dream Companies" database.

## 3. Automation Support
- If I need to bundle the extension for a manual test, I will use:
  `./.agents/skills/extension-deployment/scripts/bundle.sh`
