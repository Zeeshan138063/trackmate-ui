# Consistency checker

REQ-002, 2026-11-26. Implements REQ-002 (strategy spec section 5B).

## Why

Recruiters compare a resume with the candidate's LinkedIn profile. A start date, title or
employer that differs between them reads as a red flag, and tailoring a resume per job makes
such drift easy. JobOS holds the Master Profile and every tailored resume, and had no check that
they agree with each other or with LinkedIn.

## Goals

- Compare the Master Profile with every tailored resume: employers, titles, dates, schools,
  degrees, name, location, email, phone.
- Compare the Master Profile with text the user pastes from their own LinkedIn profile.
- Report each difference with both values. Change nothing.

## Non-goals

- JobOS does not fetch the user's LinkedIn profile (P1). The user pastes the text.
- No AI. The comparison is code, so the same input always gives the same report.
- No automatic fix. The user decides which side is right.
- Uploaded resume files (PDF, Word) are not read; only tailored versions that keep their data.
- The pasted text is not saved.

## Acceptance criteria

- **AC-1** A tailored resume that leaves roles out produces no finding. One that states a
  different title, start or end date, or shows an ended role as current, produces a conflict
  showing both values.
- **AC-2** An employer or school on a tailored resume that is not in the Master Profile is a
  conflict.
- **AC-3** Company suffixes ("Acme" and "Acme Inc.") and phone formatting are not differences.
- **AC-4** A different name, location, email or phone is a conflict. A date that cannot be read
  is a "check", not a conflict.
- **AC-5** From LinkedIn text: for each Master Profile role, different dates near the employer's
  name are a conflict; a title not found is a conflict; an employer, school or location not
  found, or no dates near an employer, is a "check".
- **AC-6** Dates are read as year and month from the formats the app and LinkedIn use, and
  compared by month only when both sides give one.
- **AC-7** The Resume page has "Check consistency": it loads the newest tailored version per
  application, takes optional LinkedIn text, and lists findings per document, conflicts first,
  or says that nothing differs.
- **AC-8** If tailored resumes cannot be loaded, the dialog says so and the LinkedIn check
  still works.

## Design

- `src/utils/consistency.ts` (pure): `parseYearMonth`, `compareResume`, `compareLinkedInText`,
  `buildReport`.
- `src/components/resume/ConsistencyChecker.tsx`: button and dialog, on `pages/ResumeBuilder.tsx`.
- Reads `application_resumes` (existing RLS). No migration.

## Risks

- Pasted profile text has no fixed layout. The checker looks for each employer by name and for
  dates and the title within a few lines of it. It can miss or mis-pair a role when one employer
  has several roles. Mitigation: anything it cannot confirm is a "check", and both values are
  shown.
