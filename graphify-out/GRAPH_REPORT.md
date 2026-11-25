# Graph Report - trackmate-ui  (2026-11-25)

## Corpus Check
- 287 files · ~141,224 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 4, .css 2, .example 1)

## Summary
- 2168 nodes · 6620 edges · 92 communities (72 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- supabase-js.js
- Input
- react
- Button
- J
- cadence.ts
- ATSAutofiller
- cn
- ports.ts
- resume.ts
- MailAccount
- sidebar.tsx
- dependencies
- t
- CareerPilot AI Browser Extension
- fetch-jobs/index.ts
- Trackers.tsx
- log
- AvailabilitySettings.tsx
- followups-telegram/index.ts
- package.json
- SupabaseRepo
- _debug
- EditJobDialog.tsx
- adapters_test.ts
- devDependencies
- popup.js
- constructor
- hooks/use-toast.ts
- draft.ts
- Badge
- runtime.ts
- Repo
- JobExtractor
- claude.ts
- JobSearch.tsx
- FakeRepo
- CalendarConnector.tsx
- HistoryTree.tsx
- DreamCompanies.tsx
- manifest.json
- utils.ts
- tokens.ts
- compilerOptions
- components.json
- send
- Implementation Plan: TrackMate Website Enhancement
- Common Issues and Solutions
- compilerOptions
- Installation Guide
- User Association Flow: Extension → CareerPilot AI → Database
- form.tsx
- Setup (once)
- n
- carousel.tsx
- getClaims
- JobTable.tsx
- file-parser.ts
- compilerOptions
- chart.tsx
- types.ts
- _binaryEncodeUserBroadcastPush
- pagination.tsx
- Extension Test Cases
- Perplexity Job Search Integration
- Extension Update Changelog
- The 431 Error Fix Requires Extension Reload
- S3Helper
- vite.config.ts
- sheet.tsx
- Quick Fix: Generate Extension Icons
- scripts
- 🎯 CareerPilot AI - AI-Powered Career Growth & Job Tracker
- next-themes
- uuid
- Logger
- @radix-ui/react-aspect-ratio
- @radix-ui/react-collapsible
- icons/README.md
- @ai-sdk/google
- @radix-ui/react-dropdown-menu
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-toast
- @radix-ui/react-tooltip
- tailwind-merge
- vaul
- zod

## God Nodes (most connected - your core abstractions)
1. `cn()` - 249 edges
2. `Button` - 116 edges
3. `react` - 115 edges
4. `lucide-react` - 88 edges
5. `Card` - 71 edges
6. `CardContent` - 68 edges
7. `Input` - 63 edges
8. `Badge()` - 57 edges
9. `CardHeader` - 57 edges
10. `CardTitle` - 55 edges

## Surprising Connections (you probably didn't know these)
- `1. **User Authentication in TrackMate UI**` --references--> `useAuth()`  [INFERRED]
  extension/AUTHENTICATION.md → src/hooks/useAuth.tsx
- `**2. SEO & Navigation (Global)**` --references--> `usePageTitle()`  [INFERRED]
  docs/improvement_plan.md → src/hooks/usePageTitle.ts
- `Added: ATS Autofiller (new class `ATSAutofiller`)` --references--> `ATSAutofiller`  [INFERRED]
  extension/CHANGES.md → extension/content.js
- `uploadOrUpdate()` --indirect_call--> `at()`  [INFERRED]
  extension/supabase-js.js → supabase/functions/_shared/followups/cadence_test.ts
- `Improved: Data storage` --references--> `buildSafeParams()`  [INFERRED]
  extension/CHANGES.md → extension/background.js

## Import Cycles
- None detected.

## Communities (92 total, 20 thin omitted)

### Community 0 - "supabase-js.js"
Cohesion: 0.02
Nodes (52): analytics(), catch(), channel(), cloneRequestState(), createNamespace(), createNamespaceIfNotExists(), createTable(), createTableIfNotExists() (+44 more)

### Community 1 - "Input"
Cohesion: 0.14
Nodes (49): AddContactDialog(), AddEngagementDialog(), AddInterviewFeedbackDialog(), formSchema, AddJobDialog(), DreamCompanyModal(), DreamCompanySearch(), DreamCompanySearchProps (+41 more)

### Community 2 - "react"
Cohesion: 0.08
Nodes (45): react, react-dom, react-router-dom, sonner, @supabase/supabase-js, App(), PageTitleHandler(), queryClient (+37 more)

### Community 3 - "Button"
Cohesion: 0.15
Nodes (41): lucide-react, CareerGoalSection(), DailyStats(), DailyStatsProps, DatesCalendar(), DreamCompaniesStats(), JobApplicationsChart(), JobApplicationsChartProps (+33 more)

### Community 4 - "J"
Cohesion: 0.08
Nodes (61): an(), _approveAuthorization(), _createOAuthClient(), createUser(), _deleteFactor(), _deleteOAuthClient(), deleteUser(), _denyAuthorization() (+53 more)

### Community 5 - "cadence.ts"
Cohesion: 0.07
Nodes (45): CadenceDecision, CadenceInput, CHASEABLE, CLOSED, ExistingFollowUp, JobStatus, laterOf(), nextFollowUp() (+37 more)

### Community 6 - "ATSAutofiller"
Cohesion: 0.06
Nodes (34): Badge, buildSafeParams(), TabStore, Added: ATS Autofiller (new class `ATSAutofiller`), Added: ATS Banner, Added: ATS detection on popup open, Added: ATS Detector (new class `ATSDetector`), Added: "Autofill" button (+26 more)

### Community 7 - "cn"
Cohesion: 0.06
Nodes (49): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator(), CommandSeparator (+41 more)

### Community 8 - "ports.ts"
Cohesion: 0.08
Nodes (32): ACTIVE_JOB, OPEN, Row, FollowUpKind, ApprovalCard, Classifier, Draft, DraftContext (+24 more)

### Community 9 - "resume.ts"
Cohesion: 0.08
Nodes (37): ai, MasterProfileEditorProps, ResumeImporterProps, ResumePreview(), ResumePreviewProps, ATSTemplate(), ATSTemplateProps, EuropassTemplate() (+29 more)

### Community 10 - "MailAccount"
Cohesion: 0.08
Nodes (21): GmailHeader, GmailMessage, GmailOptions, GmailProvider, header(), META_HEADERS, toMailMessage(), FetchFn (+13 more)

### Community 11 - "sidebar.tsx"
Cohesion: 0.08
Nodes (36): AppSidebar(), bottomItems, navigationItems, Header(), Layout(), LayoutProps, NotificationChecker(), Sidebar (+28 more)

### Community 12 - "dependencies"
Cohesion: 0.04
Nodes (45): dependencies, ai@^5.0.113, clsx@^2.1.1, cmdk@^1.1.1, date-fns@^3.6.0, embla-carousel-react@^8.6.0, lucide-react@^0.462.0, @radix-ui/react-accordion@^1.2.11 (+37 more)

### Community 13 - "t"
Cohesion: 0.06
Nodes (44): ar(), _authenticate(), _challenge(), _challengeAndVerify(), createBucket(), createIndex(), createSignedUploadUrl(), createSignedUrl() (+36 more)

### Community 14 - "CareerPilot AI Browser Extension"
Cohesion: 0.05
Nodes (38): 1. **User Authentication in TrackMate UI**, 2. **Job Storage with User Association**, 3. **Extension Data Flow**, 4. **Security & Data Isolation**, 5. **Extension Authentication Check**, 6. **Database Schema**, Best Practices, Extension Authentication & User Association (+30 more)

### Community 15 - "fetch-jobs/index.ts"
Cohesion: 0.06
Nodes (21): https, options, req, ATS_DOMAINS, HF_TOKEN, Job, parseATS(), searchWeb() (+13 more)

### Community 16 - "Trackers.tsx"
Cohesion: 0.15
Nodes (26): ColumnOption, ColumnsDropdown(), ColumnsDropdownProps, CompanyLogo(), CompanyLogoProps, DreamCompanySheet(), DreamCompanySheetProps, ModeToggle() (+18 more)

### Community 17 - "log"
Cohesion: 0.10
Nodes (37): _appendParams(), _clearAllTimers(), _clearTimer(), connect(), connectionState(), disconnect(), endpointURL(), flushSendBuffer() (+29 more)

### Community 18 - "AvailabilitySettings.tsx"
Cohesion: 0.10
Nodes (19): date-fns, AvailabilitySettings(), days, SelectDay(), EditMeetingDialogProps, MeetingCalendar(), MeetingCalendarProps, GoogleMeetIcon() (+11 more)

### Community 19 - "followups-telegram/index.ts"
Cohesion: 0.13
Nodes (25): bot(), onCallback(), onMessage(), TgUpdate, approvalButtons(), Button, callbackData(), keyboard() (+17 more)

### Community 20 - "package.json"
Cohesion: 0.06
Nodes (35): author, @ai-sdk/huggingface@^0.0.12, @ai-sdk/openai@^2.0.86, @hello-pangea/dnd@^18.0.1, @hookform/resolvers@^3.10.0, input-otp@^1.4.2, @novu/react@^3.11.2, @openrouter/sdk@^0.2.11 (+27 more)

### Community 21 - "SupabaseRepo"
Cohesion: 0.12
Nodes (7): check(), contactName(), d(), factsList(), SupabaseRepo, toAccount(), toFollowUp()

### Community 22 - "_debug"
Cohesion: 0.10
Nodes (35): _acquireLock(), _autoRefreshTokenTick(), _callRefreshToken(), cn(), _debug(), _emitInitialSession(), exchangeCodeForSession(), _handleProviderSignIn() (+27 more)

### Community 23 - "EditJobDialog.tsx"
Cohesion: 0.12
Nodes (27): @radix-ui/react-dialog, AddJobDialogProps, DatesCalendarProps, EditJobDialog(), EditJobDialogProps, KIND, NextUpCard(), STATUS (+19 more)

### Community 24 - "adapters_test.ts"
Cohesion: 0.12
Nodes (27): RFC-2047, RFC-2822, startUrl(), tokens, b64(), buildRawMessage(), enc, encodeHeader() (+19 more)

### Community 25 - "devDependencies"
Cohesion: 0.07
Nodes (31): devDependencies, autoprefixer@^10.4.21, eslint@^9.32.0, @eslint/js@^9.32.0, eslint-plugin-react-hooks@^5.2.0, eslint-plugin-react-refresh@^0.4.20, globals@^15.15.0, postcss@^8.5.6 (+23 more)

### Community 26 - "popup.js"
Cohesion: 0.18
Nodes (32): Improved: Code structure, chromeStorageAdapter, detectATSOnTab(), displayCompanyData(), displayContactData(), displayJobData(), displayScreenshot(), el() (+24 more)

### Community 27 - "constructor"
Cohesion: 0.08
Nodes (33): Ae(), bn(), constructor(), Dt(), Et(), _getPayloadRecords(), gt(), _handleTokenChanged() (+25 more)

### Community 28 - "hooks/use-toast.ts"
Cohesion: 0.10
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 29 - "draft.ts"
Cohesion: 0.19
Nodes (26): approvalCardText(), ConflictError, escapeHtml(), errorMessage(), isQuiet(), providerFor(), buildContext(), draftOne() (+18 more)

### Community 30 - "Badge"
Cohesion: 0.20
Nodes (22): AddContactDialogProps, AddEngagementDialogProps, ContactCard(), ContactCardProps, ContactDetailsDialog(), ContactDetailsDialogProps, EngagementTimeline(), EngagementTimelineProps (+14 more)

### Community 31 - "runtime.ts"
Cohesion: 0.17
Nodes (22): ACTIONS, Body, GraphNotification, exchange(), settingsRedirect(), appUrl(), background(), buildDeps() (+14 more)

### Community 33 - "JobExtractor"
Cohesion: 0.24
Nodes (4): ATSDetector, extractor, JobExtractor, PageState

### Community 34 - "claude.ts"
Cohesion: 0.11
Nodes (17): ClaudeClassifier, ClaudeClient, ClaudeDrafter, DEFAULT_CLASSIFY_MODEL, DEFAULT_DRAFT_MODEL, LABELS, ToolUseResponse, untrusted() (+9 more)

### Community 35 - "JobSearch.tsx"
Cohesion: 0.15
Nodes (17): JobQueryManager(), JobQueryManagerProps, JobSearchSettingsProps, CALLBACK_MESSAGES, OAUTH_HOSTS, Prefs, Alert, AlertDescription (+9 more)

### Community 37 - "CalendarConnector.tsx"
Cohesion: 0.21
Nodes (15): CHECKLIST_SECTIONS, JobChecklist(), JobChecklistProps, CalendarConnector(), CalendarList, MasterProfileEditor(), AccordionContent, AccordionItem (+7 more)

### Community 38 - "HistoryTree.tsx"
Cohesion: 0.12
Nodes (21): CARD, dayLabel(), describe(), DOT, FOLLOWUP_TITLE, REPLY_LABEL, Tone, Props (+13 more)

### Community 39 - "DreamCompanies.tsx"
Cohesion: 0.17
Nodes (18): @tanstack/react-query, COLUMNS, DreamCompaniesKanban(), DreamCompaniesKanbanProps, DreamCompaniesList(), DreamCompaniesListProps, DreamCompanyCard(), DreamCompanyCardProps (+10 more)

### Community 40 - "manifest.json"
Cohesion: 0.10
Nodes (20): action, default_icon, default_popup, background, service_worker, content_scripts, 128, 16 (+12 more)

### Community 41 - "utils.ts"
Cohesion: 0.14
Nodes (16): class-variance-authority@^0.7.1, class-variance-authority, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle (+8 more)

### Community 42 - "tokens.ts"
Cohesion: 0.15
Nodes (12): requestJson(), GMAIL_SCOPES, GOOGLE_TOKEN_URL, MS_TOKEN_URL, OAuthClients, OUTLOOK_SCOPES, RefreshingTokenProvider, TokenResponse (+4 more)

### Community 43 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+12 more)

### Community 44 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 45 - "send"
Cohesion: 0.13
Nodes (17): _addToPushBuffer(), _cancelRefEvent(), _cancelTimeout(), _canPush(), destroy(), _fetchWithTimeout(), _hasReceived(), httpSend() (+9 more)

### Community 46 - "Implementation Plan: TrackMate Website Enhancement"
Cohesion: 0.12
Nodes (15): **1. Auth & Onboarding**, **1. Branding Unification**, **1. Growth Engine & AI Copilot**, **1. Public Job Discovery & AI Visibility (/jobs)**, **2. Business & Growth**, **2. Dashboard & Visualization**, **2. Resume & Interview Readiness**, **2. SEO & Navigation (Global)** (+7 more)

### Community 47 - "Common Issues and Solutions"
Cohesion: 0.12
Nodes (15): 1. Screenshot Error: "The message port closed before a response was received", 2. Job Data Not Extracting Properly, 3. TrackMate URL Configuration, 4. Extension Not Loading, 5. Job Data Not Sending to TrackMate, 6. Only Company Name Extracted, Check Background Script, Check Content Script (+7 more)

### Community 48 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7 more)

### Community 49 - "Installation Guide"
Cohesion: 0.13
Nodes (14): Can't send to CareerPilot AI, Extension not loading, Icons not showing, Installation Guide, Job data not extracting, Quick Start, Step 1: Create Icons (Optional but Recommended), Step 2: Load Extension in Chrome/Edge (+6 more)

### Community 50 - "User Association Flow: Extension → CareerPilot AI → Database"
Cohesion: 0.13
Nodes (14): Automatic User Association, Code References, Complete Flow Diagram, Data Isolation, Job not appearing, Jobs from other users visible, Key Points, "Please log in" error (+6 more)

### Community 51 - "form.tsx"
Cohesion: 0.16
Nodes (14): @radix-ui/react-label@^2.1.7, @radix-ui/react-slot@^1.2.3, react-hook-form@^7.61.1, @radix-ui/react-label, @radix-ui/react-slot, react-hook-form, FormControl, FormDescription (+6 more)

### Community 52 - "Setup (once)"
Cohesion: 0.14
Nodes (13): 1. Database, 2. Google (Gmail), 3. Microsoft (Outlook / outlook.com), 4. Telegram, 5. Secrets for the edge functions, 6. Deploy, 7. In the app, Follow-up agent: setup and operations (+5 more)

### Community 53 - "n"
Cohesion: 0.21
Nodes (14): cloneDeep(), gn(), hn(), hr(), invoke(), n(), c(), i() (+6 more)

### Community 54 - "carousel.tsx"
Cohesion: 0.19
Nodes (13): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+5 more)

### Community 55 - "getClaims"
Cohesion: 0.18
Nodes (13): en(), fetchJwk(), fn(), _getAuthenticatorAssuranceLevel(), getClaims(), getSession(), getUser(), getUserIdentities() (+5 more)

### Community 56 - "JobTable.tsx"
Cohesion: 0.31
Nodes (11): JobTable(), SortConfig, SortDirection, Table, TableBody, TableCaption, TableCell, TableFooter (+3 more)

### Community 57 - "file-parser.ts"
Cohesion: 0.24
Nodes (8): mammoth@^1.11.0, pdfjs-dist@^5.4.449, mammoth, pdfjs-dist, extractTextFromDocx(), extractTextFromFile(), extractTextFromPdf(), initPdfWorker()

### Community 58 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, allowJs, baseUrl, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck (+3 more)

### Community 59 - "chart.tsx"
Cohesion: 0.27
Nodes (10): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartStyle(), ChartTooltipContent, getPayloadConfigFromPayload() (+2 more)

### Community 60 - "types.ts"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 61 - "_binaryEncodeUserBroadcastPush"
Cohesion: 0.22
Nodes (10): _binaryDecode(), _binaryEncodeUserBroadcastPush(), decode(), _decodeUserBroadcast(), encode(), _encodeBinaryUserBroadcastPush(), _encodeJsonUserBroadcastPush(), _encodeUserBroadcastPush() (+2 more)

### Community 62 - "pagination.tsx"
Cohesion: 0.24
Nodes (9): ButtonProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem, PaginationLink(), PaginationLinkProps, PaginationNext() (+1 more)

### Community 63 - "Extension Test Cases"
Cohesion: 0.25
Nodes (7): Extension Test Cases, Pre-requisites, Test Case 1: Save Job from LinkedIn, Test Case 2: Save Contact from LinkedIn Profile, Test Case 3: Save Company from LinkedIn Company Page, Test Case 4: Custom TrackMate URL, Test Case 5: Auth Token Retrieval

### Community 64 - "Perplexity Job Search Integration"
Cohesion: 0.25
Nodes (7): Database, Features, Method 1: Automated Search (Pull), Method 2: Direct Data Push (Push), Perplexity Job Search Integration, Setup, Usage

### Community 65 - "Extension Update Changelog"
Cohesion: 0.25
Nodes (7): [1.4.8] - 2026-01-29, [1.5.0] - 2026-01-30, [1.5.1] - 2026-01-31, Added, Changes, Extension Update Changelog, Fixed

### Community 66 - "The 431 Error Fix Requires Extension Reload"
Cohesion: 0.25
Nodes (7): If Still Getting 431 Errors, Important: Reload Extension After Changes, Quick Checklist, Steps to Reload Extension, Testing After Reload, The 431 Error Fix Requires Extension Reload, Why This Is Important

### Community 67 - "S3Helper"
Cohesion: 0.25
Nodes (4): @aws-sdk/client-s3@^3.948.0, @aws-sdk/client-s3, S3Helper, s3Helper

### Community 68 - "vite.config.ts"
Cohesion: 0.25
Nodes (6): lovable-tagger@^1.1.9, vite@^5.4.19, @vitejs/plugin-react-swc@^3.11.0, lovable-tagger, vite, @vitejs/plugin-react-swc

### Community 69 - "sheet.tsx"
Cohesion: 0.32
Nodes (7): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, sheetVariants

### Community 70 - "Quick Fix: Generate Extension Icons"
Cohesion: 0.29
Nodes (6): After Adding Icons, Option 1: Use the HTML Generator (Easiest), Option 2: Use Any Simple Icons, Option 3: Temporary Fix (Icons Removed), Quick Fix: Generate Extension Icons, Quick Test

### Community 71 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, build:dev, dev, lint, preview

### Community 72 - "🎯 CareerPilot AI - AI-Powered Career Growth & Job Tracker"
Cohesion: 0.33
Nodes (5): 🧩 Browser Extension, 🎯 CareerPilot AI - AI-Powered Career Growth & Job Tracker, ✨ Features, 🏗️ Getting Started, 📄 License

### Community 73 - "next-themes"
Cohesion: 0.40
Nodes (4): next-themes@^0.3.0, next-themes, Toaster(), ToasterProps

## Knowledge Gaps
- **2 isolated node(s):** `RFC-2047`, `RFC-2822`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 606 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `uploadOrUpdate()` connect `supabase-js.js` to `cadence.ts`, `t`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **What connects `RFC-2047`, `RFC-2822` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `supabase-js.js` be split into smaller, more focused modules?**
  _Cohesion score 0.01904157410345922 - nodes in this community are weakly interconnected._
- **Why does `at()` connect `cadence.ts` to `supabase-js.js`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Should `Input` be split into smaller, more focused modules?**
  _Cohesion score 0.13550536838208072 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `cn` to `Input`, `react`, `Button`, `resume.ts`, `sidebar.tsx`, `Trackers.tsx`, `AvailabilitySettings.tsx`, `EditJobDialog.tsx`, `hooks/use-toast.ts`, `Badge`, `JobSearch.tsx`, `CalendarConnector.tsx`, `HistoryTree.tsx`, `utils.ts`, `form.tsx`, `carousel.tsx`, `JobTable.tsx`, `chart.tsx`, `pagination.tsx`, `sheet.tsx`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.0841046277665996 - nodes in this community are weakly interconnected._