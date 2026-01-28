# Implementation Plan: TrackMate Website Enhancement

This plan outlines a step-by-step approach to improving the **TrackMate** platform based on the comprehensive audit report. The goal is to unify the branding, enhance UI/UX, and optimize for SEO and business growth.

---

## Phase 1: Foundation & Branding (Identity & Metadata)
*Goal: Resolve the "identity crisis" and ensure search engines/browsers recognize the brand correctly.*

### **1. Branding Unification**
- [ ] **AppSidebar**: Change "JobVelocity" to "TrackMate" and update the logo initial from "J" to "T".
- [ ] **Logo/Favicon**: Ensure the favicon and any logo assets consistently represent "TrackMate".

### **2. SEO & Navigation (Global)**
- [ ] **Dynamic Page Titles**: Implement a custom hook (`usePageTitle`) or update each page component to set `document.title` dynamically (e.g., "Dashboard | TrackMate").
- [ ] **Index.html Metadata**: Update the base meta tags to be more descriptive and brand-aligned.

---

## Phase 2: User Experience & Component Polish
*Goal: Improve the "feel" of the application and fix minor UI bugs.*

### **1. Auth & Onboarding**
- [ ] **AuthForm**: Change the password placeholder from "New Password" to "Enter Password" for the login flow.
- [ ] **Empty States**: Create a reusable `EmptyState` component with a clear Call-to-Action (CTA) for pages like Connections, Feedbacks, and Growth Engine.

### **2. Dashboard & Visualization**
- [ ] **Job Search Pipeline**: Integrate `recharts` to show visual bar/pie charts of the application funnel (Bookmarked -> Applied -> Interviewing -> Offers).
- [ ] **Recent Activity**: Add a more detailed activity feed with timestamps and direct links to jobs/meetings.

### **3. Trackers (The Core Tool)**
- [ ] **Drag & Drop**: Implement kanban-style drag-and-drop for moving job applications between statuses.
- [ ] **Bulk Actions**: Add ability to bulk-update statuses or delete multiple entries.

---

## Phase 3: Functionality & Retention Enhancements
*Goal: Add high-value features that keep users engaged and prove the "AI agent" value.*

### **1. Growth Engine & AI Copilot**
- [ ] **Guided AI Generator**: Add "Prompt Templates" for LinkedIn posts (e.g., "Industry Insight," "Personal Achievement," "Networking").
- [ ] **Copilot Onboarding**: Add a "Pro-tips" modal for the Application Copilot to explain how it prioritizes the user's workload.

### **2. Resume & Interview Readiness**
- [ ] **Resume Templates**: Offer 2-3 distinct layouts (Modern, Academic, Creative) in the Resume Builder.
- [ ] **Interview Feedback**: Fix the skeleton loader persistence. Ensure the "No Feedbacks Found" state is visually attractive.

---

## Phase 4: Growth, SEO & Geo-Targeting
*Goal: Drive new traffic and provide localized value.*

### **1. Public Job Discovery (/jobs)**
- [ ] **SEO Structured Data**: Implement `JobPosting` schema for job results to appear in Google Jobs search.
- [ ] **Geo-location**: Add IP-based location detection to automatically filter "Jobs near [Current City]".
- [ ] **Navigation Loop**: Add a visible "Go to Dashboard" button for logged-in users visiting public pages.

### **2. Business & Growth**
- [ ] **Social Sharing**: Add "Share my resume" or "Share this interesting job" functionality to create viral loops.
- [ ] **Email Summaries**: (Optional Backend Task) Implement weekly career growth summaries.

---

## Timeline & Success Metrics
- **Week 1**: Phase 1 & 2 (Quick fixes and UI Branding).
- **Week 2**: Phase 3 (D&D on Trackers, AI Enhancements).
- **Week 3**: Phase 4 (SEO, Geo-targeting, and Growth loops).

**Success Metrics**:
- Reduced bounce rate on public jobs.
- High user engagement on Trackers (measured by drag-and-drop usage).
- Clear brand recognition in browser tabs.
