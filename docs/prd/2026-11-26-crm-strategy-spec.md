# JobOS: strategy and feature spec for a job-search CRM

Prepared for an audit of jobos.dev. The auditor should mark each feature in section 5 as **exists**, **partial** or **missing**, then plan work in the priority order of section 7.

## 1. What the product should do

The user sets a target (role types, plus one region or worldwide). JobOS then runs the whole search as a daily action queue: which jobs to apply to, which people to engage with, which messages to send, which follow-ups are due, and what to practise. The user approves and sends; JobOS drafts, schedules, tracks and learns from the results.

The centre of the product is the **relationship pipeline**, not the application list. Section 3 gives the evidence for that choice.

## 2. Ground rules

1. **No guaranteed outcome.** No system can secure a job 100% of the time; employers decide. The product promises a better process and shows honest numbers. Marketing copy and in-app text must not claim guaranteed interviews or offers.
2. **No LinkedIn bots.** LinkedIn's help centre says it does not permit third-party software, including browser extensions, that scrapes, modifies the appearance of, or automates activity on its site, and that accounts using such tools risk restriction or shutdown. Its User Agreement forbids bots that add contacts, send messages, or like, comment and share. A restricted account ends the user's search on its main channel, so JobOS must never click, connect, message, like or comment on LinkedIn for the user.
3. **Assist, do not act.** JobOS prepares the action (who, why, a draft, a deep link). The user opens LinkedIn and does it by hand, then marks it done.
4. **Truth only.** Tailoring means choosing and rewording real experience. JobOS must never invent experience, dates, skills, location or visa status, and should warn when the profile and CV disagree.
5. **The user submits every application and sends every message.**
6. **Contact data is minimal.** Store only what the user enters or pastes about a contact. Offer delete and export.

**Audit note on the existing Chrome extension:** the public site says the extension captures job details from 20+ sites. Check exactly what it does on linkedin.com. LinkedIn's wording covers extensions that scrape or alter its pages, so capture there is a risk to users' accounts. Safer inputs are in section 5C.

## 3. Strategies and the evidence behind them

Figures below come from search results I did not open in full; confirm each at its source before quoting it publicly.

| # | Strategy | Evidence | Strength |
|---|---|---|---|
| 1 | Get referred instead of applying cold | A Lever study reported by SHRM found about 1 in 100 candidates is hired overall, but 1 in 16 referred candidates. Ashby's analysis of nearly 250K hires found referrals a steady ~18% of hires | Strong direction; exact multipliers vary by source |
| 2 | Tailor the CV to each job | Wellfound reported a 2.1x higher interview conversion for tailored resumes in an analysis of over a million applications | Good; single vendor analysis |
| 3 | Apply early | Wellfound reported an 8.56% match rate for day-one applications against 4.64% for month-old postings. A Boston University economist's study also found applying early is better | Good |
| 4 | Fewer, focused applications | Wellfound describes 10-20 focused applications as the sweet spot over mass applying | Moderate; vendor data |
| 5 | Warm up before asking (follow, engage, then message) | Practitioner advice, including a KSA recruiter's account. No controlled data found | Weak evidence, low cost, low risk |
| 6 | Send in the recipient's morning | One older analysis (TalentWorks) claimed much higher interview odds for applications before 10 a.m. | Weak; treat as a cheap default |
| 7 | Stay under about 100 connection invites a week | LinkedIn confirms invitation limits exist and usually clear in about a week; the ~100 figure is widely observed but not published by LinkedIn | Moderate |
| 8 | Two-page CV with numbers near the top | Recruiter practice; Wellfound also advises optimising the "first 10 seconds" | Moderate |
| 9 | Follow up, a limited number of times | Common practice; no data found | Weak evidence; cap it to avoid annoyance |

Design consequence: features that raise the referral rate and application quality come first. Features built on weak evidence (send time, warm-up length) ship as defaults the user can change, and the analytics in 5K should test them on the user's own data.

## 4. The method the product runs

1. **Target:** roles, region, constraints.
2. **Position:** one true profile, CV variants, proof of work.
3. **Source:** jobs and target companies.
4. **Warm up:** build relationships at target companies before a job appears.
5. **Apply:** early, tailored, with a referral where one exists.
6. **Interview:** prepared and rehearsed.
7. **Close:** offer, visa and relocation paperwork.
8. **Learn:** weekly numbers decide what changes.

## 5. Features

### A. Target setup ("campaign")

- Role families with title variants (the user picks from a library and edits).
- Region: one or more countries or cities, or worldwide, with remote options.
- Constraints: needs visa sponsorship, languages spoken, nationality restrictions to exclude, pay floor, earliest start date.
- Capacity: hours per day the user can give. Every daily queue is sized to this.
- **Region packs** that change behaviour per market. A KSA pack would include: flags for "Saudi nationals only", Arabic required, transferable iqama required; a Sunday-Thursday working week; a calendar of slow periods (Ramadan, Eid, Hajj); and the local job portals.
- Several campaigns can run at once (for example KSA on-site and worldwide remote).

Done when: changing the campaign changes job filtering, scoring caps, send-time scheduling and the daily queue.

### B. Profile and assets

- Master Profile as the single source of facts.
- **Consistency checker:** compares the Master Profile, each CV and the user's pasted LinkedIn profile text, and lists conflicts in dates, titles, location, figures and visa status.
- CV variants per role family, generated only from Master Profile facts.
- CV quality checks: at most two pages, measurable results near the top, no hobbies, address or ID numbers, contact details that are true for where the user is.
- Per-job keyword match: shows required terms from the posting that are missing, split into "you have this, add it" and "you do not have this, do not add it".
- Proof library: case studies, demos and links to attach to messages and applications.

### C. Job intake

- Sources that do not put accounts at risk: public applicant-tracking feeds on company career pages, portals whose terms allow it, job-alert emails parsed from a mailbox, and paste-a-URL or paste-the-text capture.
- Deduplication across sources, keeping the company's own apply link.
- Date-range filter using the posting date, or the first-seen date when none is given, and showing which was used.
- **Freshness alert:** jobs above the fit threshold posted in the last 48 hours go to the top of today's queue.
- Extracted fields: years required, must-have skills, language, nationality or residency restriction, sponsorship, pay.
- Fit score with hard caps for constraints the user cannot meet.
- **"Who do I know here?"** on every job: contacts at that company and their warmth stage.

### D. Company watchlist

- A target list of roughly 30-50 companies per campaign, each with a stage (researching, warming up, applied, interviewing, closed).
- Per company: open roles, contacts, notes, last touch, next action.
- Signals the user can log or that feeds provide: new postings, a hiring manager's post, funding or expansion news.

### E. Relationship CRM (the core)

- **Contact record:** name, company, role type (recruiter, hiring manager, peer engineer, alumni, other), how the user knows them, profile link, notes, every interaction with its date.
- **Warmth stages:** Identified → Following → Engaged (2 or more genuine interactions) → Connected → In conversation → Advocate (has referred or offered to).
- **Next-action engine:** each contact always has one next action and a due date, derived from stage and history.
- **Cadence templates,** editable:
  - Recruiters and HR: follow, engage for 7-10 days, connect, message when applying.
  - Alumni and peers: connect with a short specific note, then ask for a 15-minute call.
  - Hiring managers: engage with their content, then send a short note that leads with relevant proof.
- **Message drafting:** greeting, one line on why this person, one line of relevant proof, one small ask. Drafts must use the user's notes about the contact and may not be identical across contacts.
- **Ask ladder:** advice first, then a call, then a referral. The referral ask unlocks only after a real exchange is logged.
- **"I applied" ping:** when the user applies somewhere a contact works, queue a short note to that contact the same day.
- **Follow-up rules:** at most two follow-ups, 5-7 days apart, then the contact rests for 30 days.
- **Courtesy tracking:** thank-you after any call or referral; an update to the referrer when the outcome is known.
- **Limits tracker:** counts invitations the user marks as sent in a rolling seven days, warns at 80, and stops queuing at 100.
- **Connections import:** the user uploads LinkedIn's own data export of their connections, so JobOS can show who they already know at each target company.
- Do-not-contact flag.

Done when: a user with 40 contacts can open JobOS and see a short, ordered list of people to act on today, each with a reason and a draft.

### F. Engagement assistant

- Daily list of 5-10 contacts whose recent activity is worth engaging with, each opened by the user through a link.
- The user pastes the post text; JobOS drafts a comment that adds a point from the user's own experience. Generic praise is rejected.
- The user posts it and marks it done. Nothing is posted by JobOS.

### G. Content engine

- Two posts a week by default, drawn from content pillars tied to the target role (for example: build problems solved, customer deployment lessons, measured results).
- Turns Master Profile achievements and proof-library items into drafts in the user's voice.
- Tracks, from numbers the user enters, profile views and inbound recruiter messages per post.
- No engagement pods and no engagement-bait formats.

### H. Applications

- Referral-first prompt: if a contact at the company is at "In conversation" or above, suggest asking them before applying cold.
- Tailored CV and a freshly written email or cover note per job.
- Email checks: specific subject line, greeting with the person's name, one complete message with the CV attached, never a forwarded email.
- Send-time scheduling in the recipient's morning and working week, taken from the region pack.
- Form autofill where the site's terms allow, with the user reviewing and submitting.
- A daily cap (default five) to protect quality.

### I. Interviews

- Company brief per interview: product, recent news, the interviewers' public background, likely questions.
- Question bank per role family, including scenario questions for customer-facing engineering roles.
- Story bank: the user's achievements in situation-action-result form, reusable across interviews.
- Recorded practice with playback, plus feedback on content and length.
- Pay research notes and a prepared answer on expectations.
- Logistics checklist: time zone, route or link test, arrive 10-15 minutes early, dress.
- After the interview: thank-you draft, debrief notes, questions asked (fed back into the bank).

### J. Offer and relocation

- Offer comparison including pay, allowances, visa sponsorship, notice and start date.
- Per-country checklist for work authorisation, with a document tracker (attestations, medicals, expiry dates).
- A warning screen on common scams, such as paying for a visa or residency permit.

### K. Analytics and the learning loop

- Funnel: jobs seen → applied → replies → interviews → offers, split by source, role family, CV variant and whether a referral was involved.
- Relationship funnel: identified → connected → conversations → referrals.
- Comparison of message templates and send times on the user's own data.
- **Diagnosis rules** in plain words, for example: many applications and few replies points to the CV or targeting; interviews without offers points to preparation; few conversations points to outreach.
- A weekly review screen with one recommended change.

### L. Visit planner (for searches that involve travelling to a market)

- Meetings pipeline for the trip: requested, confirmed, held.
- A go or no-go indicator based on confirmed meetings and active interviews.
- Budget and dates, with the region pack's slow periods shown.

### M. Daily queue (ties everything together)

One screen, sized to the user's stated capacity, in this order:

1. Fresh high-fit jobs to apply to.
2. Follow-ups and replies due.
3. People to engage with or connect to.
4. One practice task.
5. One content task on posting days.

Each item shows why it is there and can be completed, snoozed or skipped. Skipped items feed the analytics.

### N. Claude and MCP tools

Expose tools so an assistant can run the loop with the user: list and filter jobs by date range and campaign; add or import jobs; read the Master Profile; score a job; generate materials; list contacts by stage and next action; log an interaction; get today's queue; update statuses; read the analytics summary. Every tool that sends or submits anything outside JobOS is out of scope.

## 6. Operating rhythm the product should produce

| When | What the user does | Default amount |
|---|---|---|
| Daily, in the target market's morning | Apply to fresh high-fit jobs | Up to 5 |
| Daily | Engage with contacts' posts | 5-10 comments |
| Daily | New connection requests | 15-20, under the weekly limit |
| Daily | Follow-ups and "I applied" notes | As due |
| Daily | Interview practice | 1 recorded answer |
| Twice a week | Publish a post | 2 |
| Weekly | Review numbers, change one thing | 1 review |

These amounts are starting defaults, not proven optima; the analytics should adjust them.

## 7. Priorities

**P0 (the core loop):** campaign setup with constraints; consistency checker; contact records with warmth stages and next actions; daily queue; message drafting; "who do I know here?"; referral-first prompt; freshness alert; limits tracker.

**P1:** cadence templates; engagement assistant; keyword match per job; send-time scheduling; funnel analytics with diagnosis rules; connections import; region packs (KSA first); interview story bank and question bank.

**P2:** recorded practice; content tracking; visit planner; offer and relocation module; template comparison; MCP tool coverage for all of the above.

## 8. Audit checklist

1. Does the extension read, change or act on linkedin.com pages? What exactly?
2. Do the AI Job Agents fetch from LinkedIn or other sites whose terms forbid it? Which sources are used and how?
3. Does anything in JobOS send, post, connect or submit without a human click?
4. Does the Connections CRM have stages, next actions and a daily queue, or only a list with reminders?
5. Can a job show the user's contacts at that company?
6. Is the match score capped for constraints the user cannot meet (nationality, language, sponsorship)?
7. Can the Copilot output anything not supported by the Master Profile?
8. Is there a check for conflicts between CV, profile and LinkedIn text?
9. Is there a date-range filter with posted versus first-seen dates?
10. Are there funnel metrics by source and by referral versus cold?
11. Does any page or advert promise guaranteed results, or state figures (such as response-rate lifts or user counts) that cannot be evidenced? The public site showed two different user counts.
12. Which MCP tools exist today, and which from section 5N are missing?

## 9. Deliberately excluded

| Excluded | Reason |
|---|---|
| Automated LinkedIn connecting, messaging, liking, commenting or profile viewing | Forbidden by LinkedIn; risks the user's account |
| Scraping LinkedIn profiles or search results | Forbidden by LinkedIn |
| Mass or one-click applying to hundreds of jobs | Lower interview rates than focused applying, and many portals forbid automated submission |
| Bulk identical messages | Reads as spam and damages the user's reputation with the people who could refer them |
| Showing a false location, residency or visa status | Fails at screening and harms referrers |
| Engagement pods and bait posts | Inauthentic engagement, also against LinkedIn's rules |
| Any "guaranteed job" claim | Not true |

## 10. Sources

- LinkedIn Help, Prohibited software and extensions: https://www.linkedin.com/help/linkedin/answer/a1341387
- LinkedIn Help, Automated activity on LinkedIn: https://www.linkedin.com/help/linkedin/answer/90586
- LinkedIn Help, Invitation limit reached: https://www.linkedin.com/help/billing/answer/a550555
- SHRM, Lever study shows 1 in 100 candidates is hired: https://www.shrm.org/topics-tools/news/talent-acquisition/lever-study-shows-1-100-candidates-hired
- Ashby, Are referred candidates more likely to get hired?: https://www.ashbyhq.com/talent-trends-report/reports/referrals
- Ashby, source-of-hire report: https://www.ashbyhq.com/talent-trends-report/reports/inbound
- Wellfound, How to double your interview rate: https://wellfound.com/blog/how-to-double-your-interview-rate-what-500-000-job-applications-revealed
- Wellfound, job search data deep-dive: https://help.wellfound.com/article/1197-job-search-data
- Boston University, research on applying early: https://www.bu.edu/articles/2025/looking-for-jobs-on-indeed-or-linkedin
- Mic, best time to apply (TalentWorks analysis): https://mic.com/articles/185548/career-advice-the-best-day-and-time-to-apply-to-a-job-to-get-an-interview
- JobOS public site: https://jobos.dev
