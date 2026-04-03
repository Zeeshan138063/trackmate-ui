---
description: General instructions and standards for the Trackmate UI project.
---
// turbo-all

# Project Rules & Router

This file is your global "claude.md" for JobOS. It acts as a router to keep my context small and save you tokens. 

---

## 🚀 The JobOS Router
When you ask for a task, I will first check which of these domain-specific workflows to load:

1.  **[UI & Design](file:///Users/MAC/hobby/trackmate-ui/.agents/workflows/ui_development.md)**: React, Tailwind, and `shadcn/ui` standards for JobOS.
2.  **[Extension Logic](file:///Users/MAC/hobby/trackmate-ui/.agents/workflows/extension_development.md)**: Manifest V3, background workers, and content scripts.
3.  **[Extension Testing](file:///Users/MAC/hobby/trackmate-ui/.agents/workflows/extension_testing.md)**: Standard test cases for LinkedIn and other job boards.
4.  **[Store Deployment (Skill)](file:///Users/MAC/hobby/trackmate-ui/.agents/skills/extension-deployment/SKILL.md)**: Automated bundling and store compliance auditing for JobOS.
5.  **[Supabase & Data](file:///Users/MAC/hobby/trackmate-ui/supabase/README.md)**: Database and Auth schema.

---

## 🛠 Core Project Standards

### 1. Performance & Token Savings
- **Modular Load**: I will not read the entire `src/` or `extension/` directory unless absolutely necessary. I will use `grep_search` to find specific code.
- **Concise Code**: Follow functional patterns in React and standard Chrome APIs in the extension.

### 2. The "Extension (Copy)" Warning
- **LIVE CODE**: Use the `./extension/` directory for all core logic.
- **BACKUP**: The `./extension (Copy)/` folder is for reference only. **Never modify it.**

### 3. Feature Mapping
- **Job Boards**: Logic for LinkedIn, Indeed, etc., is in `extension/content.js`.
- **AI Logic**: The main AI features use the `@ai-sdk` (Google, OpenAI) as seen in `package.json`.
- **Domain**: All public links should point to `jobos.dev`.

---

## 💡 Pro-Tip
Use the **`/project_rules`** slash command at the start of a deep task to remind me of this router.
