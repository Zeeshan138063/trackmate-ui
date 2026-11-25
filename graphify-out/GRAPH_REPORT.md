# Graph Report - trackmate-ui  (2026-11-26)

## Corpus Check
- 343 files · ~172,308 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 5, .css 2, .code-workspace 1)

## Summary
- 2536 nodes · 7085 edges · 137 communities (98 shown, 39 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 92 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9e1b6872`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- supabase-js.js
- react
- resume.ts
- Button
- adapters_test.ts
- Input
- JobExtractor
- cn
- J
- ATSAutofiller
- cadence.ts
- ports.ts
- runtime.ts
- sidebar.tsx
- popup.js
- t
- Trackers.tsx
- devDependencies
- dependencies
- services_test.ts
- fetch-jobs/index.ts
- backend: handoff
- log
- ResumeImporter.tsx
- SupabaseRepo
- _debug
- draft.ts
- FakeRepo
- constructor
- EditJobDialog.tsx
- package.json
- MeetingService
- FollowUpSettings.tsx
- Repo
- 5. Features
- tokens.ts
- HistoryTree.tsx
- claude.ts
- manifest.json
- compilerOptions
- Badge
- steps
- components.json
- send
- sheet.tsx
- Implementation Plan: TrackMate Website Enhancement
- Common Issues and Solutions
- dropdown-menu.tsx
- compilerOptions
- Setup (once)
- Installation Guide
- User Association Flow: Extension → JobOS AI → Database
- JobTable.tsx
- n
- carousel.tsx
- getClaims
- form.tsx
- file-parser.ts
- compilerOptions
- 🏗 Store-Ready Walkthrough
- chart.tsx
- toast.tsx
- types.ts
- <module>: handoff
- _binaryEncodeUserBroadcastPush
- src/: the CRM web app
- pagination.tsx
- JobOS app (repo: trackmate-ui)
- <Feature>
- scripts
- 2. Core Test Missions (LinkedIn)
- 🛠 Core Project Standards
- Extension Test Cases
- Perplexity Job Search Integration
- Extension Update Changelog
- The 431 Error Fix Requires Extension Reload
- Unreleased
- 2026-11-26: agent setup and first architecture read
- Quick Fix: Generate Extension Icons
- CompanyLogo.tsx
- supabase/: the backend
- followups: the follow-up agent
- JobOS Extension Development Standards
- JobOS UI Development Standards
- 0001. Decisions that bind the code are recorded as ADRs
- NNNN. <Decision, as a statement>
- <Term>: the definition
- Runbook: the code graphs are missing, stale or not used
- Runbook: <symptom as a user or operator reports it>
- 🎯 CareerPilot AI - AI-Powered Career Growth & Job Tracker
- interview.ts
- Plan: <feature>
- OQ-01: What happens to the code that already collects data from LinkedIn?
- OQ-##: <the question, as a question>
- Docs
- next-themes
- The plan
- pull_request_template.md
- Logger
- Work tracker
- Product requirements
- Open questions
- @radix-ui/react-aspect-ratio
- @radix-ui/react-collapsible
- idleReason
- AGENTS.md
- bundle.sh
- decisions/README.md
- principles.md
- context/README.md
- definitions/README.md
- requirements.md
- coverage-matrix.md
- qa/README.md
- specs/README.md
- icons/README.md
- skills-db.js
- @hello-pangea/dnd
- @hookform/resolvers
- pdf-lib
- @radix-ui/react-accordion
- @radix-ui/react-alert-dialog
- @radix-ui/react-hover-card
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-select
- @radix-ui/react-switch
- @radix-ui/react-toggle-group
- react-day-picker
- react-resizable-panels
- recharts
- tailwindcss-animate@^1.0.7
- zod

## God Nodes (most connected - your core abstractions)
1. `cn()` - 247 edges
2. `react` - 117 edges
3. `Button` - 115 edges
4. `lucide-react` - 88 edges
5. `Card` - 71 edges
6. `CardContent` - 68 edges
7. `Input` - 63 edges
8. `Badge()` - 59 edges
9. `CardHeader` - 59 edges
10. `CardTitle` - 57 edges

## Surprising Connections (you probably didn't know these)
- `1. **User Authentication in TrackMate UI**` --references--> `useAuth()`  [INFERRED]
  extension/AUTHENTICATION.md → src/hooks/useAuth.tsx
- `**2. SEO & Navigation (Global)**` --references--> `usePageTitle()`  [INFERRED]
  docs/improvement_plan.md → src/hooks/usePageTitle.ts
- `Added: ATS Autofiller (new class `ATSAutofiller`)` --references--> `ATSAutofiller`  [INFERRED]
  extension/CHANGES.md → extension/content.js
- `Files` --references--> `ATSAutofiller`  [INFERRED]
  extension/CLAUDE.md → extension/content.js
- `Files` --references--> `JobExtractor`  [INFERRED]
  extension/CLAUDE.md → extension/content.js

## Import Cycles
- None detected.

## Communities (137 total, 39 thin omitted)

### Community 0 - "supabase-js.js"
Cohesion: 0.02
Nodes (52): analytics(), catch(), channel(), cloneRequestState(), createNamespace(), createNamespaceIfNotExists(), createTable(), createTableIfNotExists() (+44 more)

### Community 1 - "react"
Cohesion: 0.07
Nodes (61): date-fns, react, react-dom, react-router-dom, @supabase/supabase-js, App(), PageTitleHandler(), queryClient (+53 more)

### Community 2 - "resume.ts"
Cohesion: 0.05
Nodes (65): ai@^5.0.113, ai, JobSearchSettingsProps, ApplicationResumes(), kb(), Props, MasterProfileEditorProps, ResumeImporterProps (+57 more)

### Community 3 - "Button"
Cohesion: 0.14
Nodes (45): lucide-react, CareerGoalSection(), cards, DailyStats(), DailyStatsProps, DatesCalendar(), DreamCompaniesStats(), DreamCompanyCard() (+37 more)

### Community 4 - "adapters_test.ts"
Cohesion: 0.06
Nodes (38): RFC-2047, RFC-2231, RFC-2822, tokens, GmailHeader, GmailMessage, GmailOptions, GmailProvider (+30 more)

### Community 5 - "Input"
Cohesion: 0.15
Nodes (45): AddContactDialog(), AddContactDialogProps, AddEngagementDialog(), AddInterviewFeedbackDialog(), formSchema, AddJobDialog(), ContactCardProps, ContactDetailsDialogProps (+37 more)

### Community 6 - "JobExtractor"
Cohesion: 0.06
Nodes (42): 1. **User Authentication in TrackMate UI**, 2. **Job Storage with User Association**, 3. **Extension Data Flow**, 4. **Security & Data Isolation**, 5. **Extension Authentication Check**, 6. **Database Schema**, Best Practices, Extension Authentication & User Association (+34 more)

### Community 7 - "cn"
Cohesion: 0.06
Nodes (53): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator(), CommandSeparator (+45 more)

### Community 8 - "J"
Cohesion: 0.08
Nodes (61): an(), _approveAuthorization(), _createOAuthClient(), createUser(), _deleteFactor(), _deleteOAuthClient(), deleteUser(), _denyAuthorization() (+53 more)

### Community 9 - "ATSAutofiller"
Cohesion: 0.05
Nodes (36): Badge, buildSafeParams(), captureScreenshot(), TabStore, Added: ATS Autofiller (new class `ATSAutofiller`), Added: ATS Banner, Added: ATS detection on popup open, Added: ATS Detector (new class `ATSDetector`) (+28 more)

### Community 10 - "cadence.ts"
Cohesion: 0.08
Nodes (44): CadenceDecision, CadenceInput, CHASEABLE, CLOSED, ExistingFollowUp, JobStatus, laterOf(), nextFollowUp() (+36 more)

### Community 11 - "ports.ts"
Cohesion: 0.08
Nodes (35): ACTIVE_JOB, OPEN, Row, FollowUpKind, ApprovalCard, Classifier, ConflictError, Draft (+27 more)

### Community 12 - "runtime.ts"
Cohesion: 0.09
Nodes (40): Edge functions (`functions/`), GraphNotification, exchange(), settingsRedirect(), startUrl(), ClaudeDrafter, RESUME_BUCKET, SupabaseFileStore (+32 more)

### Community 13 - "sidebar.tsx"
Cohesion: 0.07
Nodes (40): AppSidebar(), bottomItems, navigationItems, injectStyles(), JobOsLogo(), JobOsLogoProps, LogoIconSvg(), LogoVariant (+32 more)

### Community 14 - "popup.js"
Cohesion: 0.10
Nodes (40): Improved: Code structure, extension/: the JobOS browser extension, Files, Handoff, Hardcoded values, Rules, Testing, Two ways data is saved (+32 more)

### Community 15 - "t"
Cohesion: 0.06
Nodes (44): ar(), _authenticate(), _challenge(), _challengeAndVerify(), createBucket(), createIndex(), createSignedUploadUrl(), createSignedUrl() (+36 more)

### Community 16 - "Trackers.tsx"
Cohesion: 0.12
Nodes (33): @tanstack/react-query, COLUMNS, DreamCompaniesKanban(), DreamCompaniesKanbanProps, DreamCompaniesList(), DreamCompaniesListProps, DreamCompanyCardProps, DreamCompanyModalProps (+25 more)

### Community 17 - "devDependencies"
Cohesion: 0.06
Nodes (37): devDependencies, autoprefixer@^10.4.21, eslint@^9.32.0, @eslint/js@^9.32.0, eslint-plugin-react-hooks@^5.2.0, eslint-plugin-react-refresh@^0.4.20, globals@^15.15.0, lovable-tagger@^1.1.9 (+29 more)

### Community 18 - "dependencies"
Cohesion: 0.05
Nodes (41): dependencies, @ai-sdk/huggingface@^0.0.12, @ai-sdk/openai@^2.0.86, clsx@^2.1.1, date-fns@^3.6.0, input-otp@^1.4.2, lucide-react@^0.462.0, @openrouter/sdk@^0.2.11 (+33 more)

### Community 19 - "services_test.ts"
Cohesion: 0.13
Nodes (27): ACTIONS, Body, bot(), onCallback(), onMessage(), TgUpdate, approvalButtons(), Button (+19 more)

### Community 20 - "fetch-jobs/index.ts"
Cohesion: 0.06
Nodes (21): https, options, req, ATS_DOMAINS, HF_TOKEN, Job, parseATS(), searchWeb() (+13 more)

### Community 21 - "backend: handoff"
Cohesion: 0.05
Nodes (31): backend: handoff, Done, Goal, How to run and test, Next step  <- start here, Remaining, Done, extension: handoff (+23 more)

### Community 22 - "log"
Cohesion: 0.10
Nodes (37): _appendParams(), _clearAllTimers(), _clearTimer(), connect(), connectionState(), disconnect(), endpointURL(), flushSendBuffer() (+29 more)

### Community 23 - "ResumeImporter.tsx"
Cohesion: 0.13
Nodes (23): CHECKLIST_SECTIONS, JobChecklist(), JobChecklistProps, CalendarConnector(), CalendarList, MasterProfileEditor(), FileDropZone(), FileDropZoneProps (+15 more)

### Community 24 - "SupabaseRepo"
Cohesion: 0.12
Nodes (7): check(), contactName(), d(), factsList(), SupabaseRepo, toAccount(), toFollowUp()

### Community 25 - "_debug"
Cohesion: 0.10
Nodes (35): _acquireLock(), _autoRefreshTokenTick(), _callRefreshToken(), cn(), _debug(), _emitInitialSession(), exchangeCodeForSession(), _handleProviderSignIn() (+27 more)

### Community 26 - "draft.ts"
Cohesion: 0.17
Nodes (29): approvalCardText(), formatSlot(), KIND_LABEL, outcomeLine(), WEEKDAY, escapeHtml(), isEmail(), errorMessage() (+21 more)

### Community 27 - "FakeRepo"
Cohesion: 0.07
Nodes (3): reply(), FakeRepo, uuid()

### Community 28 - "constructor"
Cohesion: 0.08
Nodes (33): Ae(), bn(), constructor(), Dt(), Et(), _getPayloadRecords(), gt(), _handleTokenChanged() (+25 more)

### Community 29 - "EditJobDialog.tsx"
Cohesion: 0.12
Nodes (26): @radix-ui/react-dialog, AddJobDialogProps, DatesCalendarProps, EditJobDialog(), EditJobDialogProps, JobKanbanProps, JobQueryManagerProps, EXPERIENCE_LEVELS (+18 more)

### Community 30 - "package.json"
Cohesion: 0.06
Nodes (31): author, @ai-sdk/google@^2.0.46, cmdk@^1.1.1, embla-carousel-react@^8.6.0, @marsidev/react-turnstile@^1.4.2, @novu/react@^3.11.2, @radix-ui/react-checkbox@^1.3.2, @radix-ui/react-dropdown-menu@^2.1.15 (+23 more)

### Community 31 - "MeetingService"
Cohesion: 0.11
Nodes (14): EditMeetingDialogProps, MeetingCalendarProps, GoogleMeetIcon(), MeetingCard(), MeetingCardProps, Calendar(), CalendarProps, MeetingService (+6 more)

### Community 32 - "FollowUpSettings.tsx"
Cohesion: 0.13
Nodes (21): sonner, FollowUpsTab(), JobFollowUpSettings, KIND, NextUpCard(), STATUS, JobQueryManager(), AvailabilitySettings() (+13 more)

### Community 34 - "5. Features"
Cohesion: 0.08
Nodes (25): 10. Sources, 1. What the product should do, 2. Ground rules, 3. Strategies and the evidence behind them, 4. The method the product runs, 5. Features, 6. Operating rhythm the product should produce, 7. Priorities (+17 more)

### Community 35 - "tokens.ts"
Cohesion: 0.13
Nodes (14): FetchFn, requestJson(), GMAIL_SCOPES, GOOGLE_TOKEN_URL, MS_TOKEN_URL, OAuthClients, OUTLOOK_SCOPES, RefreshingTokenProvider (+6 more)

### Community 36 - "HistoryTree.tsx"
Cohesion: 0.12
Nodes (21): CARD, dayLabel(), describe(), DOT, FOLLOWUP_TITLE, REPLY_LABEL, Tone, Props (+13 more)

### Community 37 - "claude.ts"
Cohesion: 0.12
Nodes (16): ClaudeClassifier, ClaudeClient, DEFAULT_CLASSIFY_MODEL, DEFAULT_DRAFT_MODEL, LABELS, ToolUseResponse, untrusted(), FOLLOWUP_WRITER_PROMPT (+8 more)

### Community 38 - "manifest.json"
Cohesion: 0.09
Nodes (21): action, default_icon, background, service_worker, content_scripts, 128, 16, 48 (+13 more)

### Community 39 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+12 more)

### Community 40 - "Badge"
Cohesion: 0.26
Nodes (15): AddEngagementDialogProps, ContactCard(), ContactDetailsDialog(), EngagementTimeline(), EngagementTimelineProps, Avatar, AvatarFallback, AvatarImage (+7 more)

### Community 41 - "steps"
Cohesion: 0.11
Nodes (18): GH_TOKEN, jobs, update, name, on, push, permissions, contents (+10 more)

### Community 42 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 43 - "send"
Cohesion: 0.13
Nodes (17): _addToPushBuffer(), _cancelRefEvent(), _cancelTimeout(), _canPush(), destroy(), _fetchWithTimeout(), _hasReceived(), httpSend() (+9 more)

### Community 44 - "sheet.tsx"
Cohesion: 0.16
Nodes (14): class-variance-authority@^0.7.1, class-variance-authority, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+6 more)

### Community 45 - "Implementation Plan: TrackMate Website Enhancement"
Cohesion: 0.12
Nodes (15): **1. Auth & Onboarding**, **1. Branding Unification**, **1. Growth Engine & AI Copilot**, **1. Public Job Discovery & AI Visibility (/jobs)**, **2. Business & Growth**, **2. Dashboard & Visualization**, **2. Resume & Interview Readiness**, **2. SEO & Navigation (Global)** (+7 more)

### Community 46 - "Common Issues and Solutions"
Cohesion: 0.12
Nodes (15): 1. Screenshot Error: "The message port closed before a response was received", 2. Job Data Not Extracting Properly, 3. TrackMate URL Configuration, 4. Extension Not Loading, 5. Job Data Not Sending to TrackMate, 6. Only Company Name Extracted, Check Background Script, Check Content Script (+7 more)

### Community 47 - "dropdown-menu.tsx"
Cohesion: 0.21
Nodes (11): ColumnsDropdown(), ColumnsDropdownProps, ModeToggle(), DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator (+3 more)

### Community 48 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7 more)

### Community 49 - "Setup (once)"
Cohesion: 0.13
Nodes (14): 1. Database, 2. Google (Gmail), 3. Microsoft (Outlook / outlook.com), 4. Telegram, 5. Secrets for the edge functions, 6. Deploy, 7. In the app, Follow-up agent: setup and operations (+6 more)

### Community 50 - "Installation Guide"
Cohesion: 0.13
Nodes (14): Can't send to JobOS AI, Extension not loading, Icons not showing, Installation Guide, Job data not extracting, Quick Start, Step 1: Create Icons (Optional but Recommended), Step 2: Load Extension in Chrome/Edge (+6 more)

### Community 51 - "User Association Flow: Extension → JobOS AI → Database"
Cohesion: 0.13
Nodes (14): Automatic User Association, Code References, Complete Flow Diagram, Data Isolation, Job not appearing, Jobs from other users visible, Key Points, "Please log in" error (+6 more)

### Community 52 - "JobTable.tsx"
Cohesion: 0.26
Nodes (13): ColumnOption, JobTable(), JobTableProps, SortConfig, SortDirection, Table, TableBody, TableCaption (+5 more)

### Community 53 - "n"
Cohesion: 0.21
Nodes (14): cloneDeep(), gn(), hn(), hr(), invoke(), n(), c(), i() (+6 more)

### Community 54 - "carousel.tsx"
Cohesion: 0.19
Nodes (13): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+5 more)

### Community 55 - "getClaims"
Cohesion: 0.18
Nodes (13): en(), fetchJwk(), fn(), _getAuthenticatorAssuranceLevel(), getClaims(), getSession(), getUser(), getUserIdentities() (+5 more)

### Community 56 - "form.tsx"
Cohesion: 0.21
Nodes (12): @radix-ui/react-label, @radix-ui/react-slot, react-hook-form, FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItemContext (+4 more)

### Community 57 - "file-parser.ts"
Cohesion: 0.24
Nodes (8): mammoth@^1.11.0, pdfjs-dist@^5.4.449, mammoth, pdfjs-dist, extractTextFromDocx(), extractTextFromFile(), extractTextFromPdf(), initPdfWorker()

### Community 58 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, allowJs, baseUrl, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck (+3 more)

### Community 59 - "🏗 Store-Ready Walkthrough"
Cohesion: 0.18
Nodes (10): 1. Versioning & Identity, 2. Permissions Audit (Security Compliance), 3. Production Hardening (Cloudflare Turnstile), 4. Code Cleanup & Exclusions, 📂 Artifacts & Locations, 🚀 Execution Commands, JobOS Extension: Store Deployment & Bundling, Phase 1: Bump Version (+2 more)

### Community 60 - "chart.tsx"
Cohesion: 0.27
Nodes (10): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartStyle(), ChartTooltipContent, getPayloadConfigFromPayload() (+2 more)

### Community 61 - "toast.tsx"
Cohesion: 0.38
Nodes (8): Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, toastVariants, ToastViewport, Toaster()

### Community 62 - "types.ts"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 63 - "<module>: handoff"
Cohesion: 0.20
Nodes (9): Decisions made, Done, Goal, How to run and test, Known issues and risks, <module>: handoff, Next step  <- start here, Notes for the next session (+1 more)

### Community 64 - "_binaryEncodeUserBroadcastPush"
Cohesion: 0.22
Nodes (10): _binaryDecode(), _binaryEncodeUserBroadcastPush(), decode(), _decodeUserBroadcast(), encode(), _encodeBinaryUserBroadcastPush(), _encodeJsonUserBroadcastPush(), _encodeUserBroadcastPush() (+2 more)

### Community 65 - "src/: the CRM web app"
Cohesion: 0.20
Nodes (9): AI calls, Do not touch without a spec, Extension hand-off, Handoff, How data flows, src/: the CRM web app, Stack, Tests (+1 more)

### Community 66 - "pagination.tsx"
Cohesion: 0.24
Nodes (9): ButtonProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem, PaginationLink(), PaginationLinkProps, PaginationNext() (+1 more)

### Community 67 - "JobOS app (repo: trackmate-ui)"
Cohesion: 0.22
Nodes (8): Commands, Definition of done, Finding code, How work gets done here, JobOS app (repo: trackmate-ui), Known traps, Principles, What this repo is

### Community 68 - "<Feature>"
Cohesion: 0.22
Nodes (8): Acceptance criteria, Decisions and open questions, <Feature>, Goals, Non-goals, Risks, The contract change, Why

### Community 69 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, build:dev, dev, lint, preview, test:followups, typecheck (+1 more)

### Community 70 - "2. Core Test Missions (LinkedIn)"
Cohesion: 0.25
Nodes (7): 1. Environment Setup, 2. Core Test Missions (LinkedIn), 3. Automation Support, JobOS Extension Testing Protocol, 🏢 Mission: Save Company, 👤 Mission: Save Contact, 💼 Mission: Save Job

### Community 71 - "🛠 Core Project Standards"
Cohesion: 0.25
Nodes (7): 1. Performance & Token Savings, 2. The "Extension (Copy)" Warning, 3. Feature Mapping, 🛠 Core Project Standards, 💡 Pro-Tip, Project Rules & Router, 🚀 The JobOS Router

### Community 72 - "Extension Test Cases"
Cohesion: 0.25
Nodes (7): Extension Test Cases, Pre-requisites, Test Case 1: Save Job from LinkedIn, Test Case 2: Save Contact from LinkedIn Profile, Test Case 3: Save Company from LinkedIn Company Page, Test Case 4: Custom TrackMate URL, Test Case 5: Auth Token Retrieval

### Community 73 - "Perplexity Job Search Integration"
Cohesion: 0.25
Nodes (7): Database, Features, Method 1: Automated Search (Pull), Method 2: Direct Data Push (Push), Perplexity Job Search Integration, Setup, Usage

### Community 74 - "Extension Update Changelog"
Cohesion: 0.25
Nodes (7): [1.4.8] - 2026-01-29, [1.5.0] - 2026-01-30, [1.5.1] - 2026-01-31, Added, Changes, Extension Update Changelog, Fixed

### Community 75 - "The 431 Error Fix Requires Extension Reload"
Cohesion: 0.25
Nodes (7): If Still Getting 431 Errors, Important: Reload Extension After Changes, Quick Checklist, Steps to Reload Extension, Testing After Reload, The 431 Error Fix Requires Extension Reload, Why This Is Important

### Community 76 - "Unreleased"
Cohesion: 0.29
Nodes (6): Added, Changed, Changelog, Fixed, How to add an entry, Unreleased

### Community 77 - "2026-11-26: agent setup and first architecture read"
Cohesion: 0.29
Nodes (6): 2026-11-26: agent setup and first architecture read, Next, Not done, Read first, What was found (traps that cost time), What was set up

### Community 78 - "Quick Fix: Generate Extension Icons"
Cohesion: 0.29
Nodes (6): After Adding Icons, Option 1: Use the HTML Generator (Easiest), Option 2: Use Any Simple Icons, Option 3: Temporary Fix (Icons Removed), Quick Fix: Generate Extension Icons, Quick Test

### Community 79 - "CompanyLogo.tsx"
Cohesion: 0.43
Nodes (6): CompanyLogo(), CompanyLogoProps, getAvatarColor(), getDomain(), getInitial(), INDIGO_SHADES

### Community 80 - "supabase/: the backend"
Cohesion: 0.29
Nodes (6): Handoff, Migrations (`migrations/`), Scheduled jobs (pg_cron), supabase/: the backend, Tests, There is one project and it is live

### Community 81 - "followups: the follow-up agent"
Cohesion: 0.29
Nodes (6): followups: the follow-up agent, Handoff, Layers (imports point downward only), Models, Tests, What it owns

### Community 82 - "JobOS Extension Development Standards"
Cohesion: 0.33
Nodes (5): 1. Extension Architecture, 2. Scripts, 3. Storage & States, 4. Token Efficiency Tip, JobOS Extension Development Standards

### Community 83 - "JobOS UI Development Standards"
Cohesion: 0.33
Nodes (5): 1. Branding & Styling, 2. Component Patterns (shadcn/ui), 3. Performance & Tokens, 4. Animation, JobOS UI Development Standards

### Community 84 - "0001. Decisions that bind the code are recorded as ADRs"
Cohesion: 0.33
Nodes (5): 0001. Decisions that bind the code are recorded as ADRs, Consequences, Context, Decision, Options considered

### Community 85 - "NNNN. <Decision, as a statement>"
Cohesion: 0.33
Nodes (5): Consequences, Context, Decision, NNNN. <Decision, as a statement>, Options considered

### Community 86 - "<Term>: the definition"
Cohesion: 0.33
Nodes (5): Choices we had to make, In the owner's words, <Term>: the definition, The definition, Where it is read

### Community 87 - "Runbook: the code graphs are missing, stale or not used"
Cohesion: 0.33
Nodes (5): After, One-time setup on each machine, Runbook: the code graphs are missing, stale or not used, State on 2026-11-26, Symptom and what to do

### Community 88 - "Runbook: <symptom as a user or operator reports it>"
Cohesion: 0.33
Nodes (5): After, Branches, Diagnose in one query, Runbook: <symptom as a user or operator reports it>, Symptom

### Community 89 - "🎯 CareerPilot AI - AI-Powered Career Growth & Job Tracker"
Cohesion: 0.33
Nodes (5): 🧩 Browser Extension, 🎯 CareerPilot AI - AI-Powered Career Growth & Job Tracker, ✨ Features, 🏗️ Getting Started, 📄 License

### Community 90 - "interview.ts"
Cohesion: 0.33
Nodes (5): Props, Interviewer, InterviewFeedback, InterviewFeedbackInsert, QuestionAnswer

### Community 91 - "Plan: <feature>"
Cohesion: 0.40
Nodes (4): Files, How we will know it is done, Plan: <feature>, Tasks

### Community 92 - "OQ-01: What happens to the code that already collects data from LinkedIn?"
Cohesion: 0.40
Nodes (4): OQ-01: What happens to the code that already collects data from LinkedIn?, The answer, What we built meanwhile, Why it matters

### Community 93 - "OQ-##: <the question, as a question>"
Cohesion: 0.40
Nodes (4): OQ-##: <the question, as a question>, The answer, What we built meanwhile, Why it matters

### Community 94 - "Docs"
Cohesion: 0.40
Nodes (4): Docs, Resuming work on a module, The paper trail, and the IDs that tie it together, When two documents disagree

### Community 95 - "next-themes"
Cohesion: 0.40
Nodes (4): next-themes@^0.3.0, next-themes, Toaster(), ToasterProps

### Community 96 - "The plan"
Cohesion: 0.50
Nodes (3): Decisions: `DEC-###`, Open questions: `OQ-##`, The plan

### Community 97 - "pull_request_template.md"
Cohesion: 0.50
Nodes (3): Checklist, Evidence, What and why

### Community 99 - "Work tracker"
Cohesion: 0.50
Nodes (3): 2026-11-26 - Agent setup: CLAUDE.md files, spec-driven-kit files, code graphs (no ticket, working tree on main, uncommitted), Work tracker, YYYY-MM-DD - <what> (<TICKET>, branch <branch>)

## Knowledge Gaps
- **3 isolated node(s):** `RFC-2047`, `RFC-2822`, `RFC-2231`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 861 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `uploadOrUpdate()` connect `supabase-js.js` to `cadence.ts`, `t`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **What connects `RFC-2047`, `RFC-2822`, `RFC-2231` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `supabase-js.js` be split into smaller, more focused modules?**
  _Cohesion score 0.01904157410345922 - nodes in this community are weakly interconnected._
- **Why does `at()` connect `cadence.ts` to `supabase-js.js`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.07047300525561395 - nodes in this community are weakly interconnected._
- **Why does `useAuth()` connect `react` to `Badge`, `Trackers.tsx`, `Button`, `JobExtractor`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `resume.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05134825014343087 - nodes in this community are weakly interconnected._