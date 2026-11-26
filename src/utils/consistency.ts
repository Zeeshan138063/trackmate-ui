// Consistency checker (REQ-002, strategy spec 5B).
//
// Pure and deterministic: compares the Master Profile with each tailored resume and with text
// the user pastes from their LinkedIn profile. Recruiters cross-check these; a date or title
// that differs between them reads as a red flag. No model is involved, and nothing is changed:
// the checker reports, the user decides which side is right.

import type { MasterProfile, ResumeEducation, ResumeWorkExperience } from "@/types/resume";
import { normalizeCompany } from "./company-match";

export type Severity = "conflict" | "check";

export interface Finding {
  /** `conflict`: the two sources state different facts. `check`: something is missing or could not be confirmed. */
  severity: Severity;
  /** Which document, e.g. "Resume for Backend Engineer at Acme" or "LinkedIn". */
  source: string;
  /** What it is about, e.g. "Senior Engineer at Kad". */
  subject: string;
  field: "dates" | "title" | "employer" | "education" | "location" | "name" | "contact";
  message: string;
  master?: string;
  other?: string;
}

// ------------------------------------------------------------------ dates ---

export interface YearMonth { year: number; month: number | null }

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Reads "2020-01", "2020-01-15", "01/2020", "Jan 2020", "January 2020" or "2020". Null for anything else, including "Present". */
export function parseYearMonth(value: string | null | undefined): YearMonth | null {
  const s = (value ?? "").trim().toLowerCase();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?/);
  if (m) return ym(Number(m[1]), Number(m[2]));
  m = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (m) return ym(Number(m[2]), Number(m[1]));
  m = s.match(/^([a-z]{3})[a-z]*\.?,?\s+(\d{4})$/);
  if (m && MONTHS.includes(m[1])) return ym(Number(m[2]), MONTHS.indexOf(m[1]) + 1);
  m = s.match(/^(\d{4})$/);
  if (m) return ym(Number(m[1]), null);
  return null;
}

function ym(year: number, month: number | null): YearMonth | null {
  if (year < 1950 || year > 2100) return null;
  if (month !== null && (month < 1 || month > 12)) return null;
  return { year, month };
}

/** Same year, and the same month when both give one. Two unreadable dates are not compared. */
export function sameYearMonth(a: YearMonth | null, b: YearMonth | null): boolean | null {
  if (!a || !b) return null;
  if (a.year !== b.year) return false;
  return a.month === null || b.month === null || a.month === b.month;
}

export function formatYearMonth(v: YearMonth | null): string {
  if (!v) return "not given";
  return v.month ? `${MONTHS[v.month - 1][0].toUpperCase()}${MONTHS[v.month - 1].slice(1)} ${v.year}` : String(v.year);
}

const isPresent = (role: { endDate?: string; current?: boolean }) =>
  !!role.current || !role.endDate?.trim() || /present|current|now/i.test(role.endDate);

const rangeText = (role: { startDate: string; endDate?: string; current?: boolean }) =>
  `${formatYearMonth(parseYearMonth(role.startDate))} to ${isPresent(role) ? "Present" : formatYearMonth(parseYearMonth(role.endDate))}`;

// ---------------------------------------------------------------- helpers ---

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().replace(/[^a-z0-9+#\s]/g, " ").replace(/\s+/g, " ").trim();
const sameCompany = (a: string, b: string) => !!normalizeCompany(a) && normalizeCompany(a) === normalizeCompany(b);
const roleLabel = (r: { position: string; company: string }) => `${r.position || "Role"} at ${r.company || "unknown employer"}`;

// ------------------------------------------- Master Profile vs a resume ---

/** Differences between the Master Profile and one tailored resume. A resume may leave things out; it may not state different facts. */
export function compareResume(master: MasterProfile, resume: Partial<MasterProfile> | null | undefined, source: string): Finding[] {
  const findings: Finding[] = [];
  if (!resume) return findings;

  const masterName = norm(`${master.contact.firstName} ${master.contact.lastName}`);
  const resumeName = norm(`${resume.contact?.firstName ?? ""} ${resume.contact?.lastName ?? ""}`);
  if (masterName && resumeName && masterName !== resumeName) {
    findings.push({ severity: "conflict", source, subject: "Your name", field: "name", message: "The name differs.", master: `${master.contact.firstName} ${master.contact.lastName}`.trim(), other: `${resume.contact?.firstName ?? ""} ${resume.contact?.lastName ?? ""}`.trim() });
  }
  for (const key of ["location", "email", "phone"] as const) {
    const a = master.contact[key];
    const b = resume.contact?.[key];
    const same = key === "phone" ? (a ?? "").replace(/\D/g, "") === (b ?? "").replace(/\D/g, "") : norm(a) === norm(b);
    if (a?.trim() && b?.trim() && !same) {
      findings.push({ severity: "conflict", source, subject: `Your ${key}`, field: key === "location" ? "location" : "contact", message: `The ${key} differs.`, master: a, other: b });
    }
  }

  const used = new Set<string>();
  for (const role of resume.experience ?? []) {
    const candidates = master.experience.filter((m) => sameCompany(m.company, role.company));
    if (candidates.length === 0) {
      findings.push({ severity: "conflict", source, subject: roleLabel(role), field: "employer", message: "This employer is not in your Master Profile.", other: role.company });
      continue;
    }
    // Several roles at one employer: pair by title first, then by start date, then the first unused.
    const match = candidates.find((m) => !used.has(m.id) && norm(m.position) === norm(role.position))
      ?? candidates.find((m) => !used.has(m.id) && sameYearMonth(parseYearMonth(m.startDate), parseYearMonth(role.startDate)) === true)
      ?? candidates.find((m) => !used.has(m.id))
      ?? candidates[0];
    used.add(match.id);
    findings.push(...compareRole(match, role, source));
  }

  for (const edu of resume.education ?? []) {
    const match = master.education.find((m) => norm(m.school) === norm(edu.school));
    if (!match) {
      findings.push({ severity: "conflict", source, subject: edu.school || "Education", field: "education", message: "This school is not in your Master Profile.", other: edu.school });
      continue;
    }
    findings.push(...compareEducation(match, edu, source));
  }
  return findings;
}

function compareRole(master: ResumeWorkExperience, other: ResumeWorkExperience, source: string): Finding[] {
  const out: Finding[] = [];
  const subject = roleLabel(master);
  if (norm(master.position) !== norm(other.position) && norm(other.position)) {
    out.push({ severity: "conflict", source, subject, field: "title", message: "The job title differs.", master: master.position, other: other.position });
  }
  const startSame = sameYearMonth(parseYearMonth(master.startDate), parseYearMonth(other.startDate));
  const endSame = isPresent(master) !== isPresent(other) ? false : isPresent(master) ? true : sameYearMonth(parseYearMonth(master.endDate), parseYearMonth(other.endDate));
  if (startSame === false || endSame === false) {
    out.push({ severity: "conflict", source, subject, field: "dates", message: "The dates differ.", master: rangeText(master), other: rangeText(other) });
  } else if (startSame === null || endSame === null) {
    out.push({ severity: "check", source, subject, field: "dates", message: "A date could not be read, so the dates were not compared.", master: `${master.startDate || "none"} to ${master.endDate || "Present"}`, other: `${other.startDate || "none"} to ${other.endDate || "Present"}` });
  }
  return out;
}

function compareEducation(master: ResumeEducation, other: ResumeEducation, source: string): Finding[] {
  const out: Finding[] = [];
  const subject = master.school;
  const a = norm(`${master.degree} ${master.field}`);
  const b = norm(`${other.degree} ${other.field}`);
  if (a && b && a !== b) out.push({ severity: "conflict", source, subject, field: "education", message: "The degree differs.", master: `${master.degree} ${master.field}`.trim(), other: `${other.degree} ${other.field}`.trim() });
  if (sameYearMonth(parseYearMonth(master.endDate), parseYearMonth(other.endDate)) === false) {
    out.push({ severity: "conflict", source, subject, field: "dates", message: "The end date differs.", master: formatYearMonth(parseYearMonth(master.endDate)), other: formatYearMonth(parseYearMonth(other.endDate)) });
  }
  return out;
}

// ------------------------------------- Master Profile vs LinkedIn text ---

const DATE_TOKEN = "(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?\\s+)?\\d{4}";
const RANGE = new RegExp(`(${DATE_TOKEN})\\s*(?:-|–|—|to)\\s*(${DATE_TOKEN}|present|current|now)`, "i");

export interface TextRange { start: YearMonth | null; end: YearMonth | null; present: boolean; line: string }

/** The first date range on a line such as "Jan 2020 - Present · 4 yrs", or null. */
export function findRange(line: string): TextRange | null {
  const m = line.match(RANGE);
  if (!m) return null;
  const present = /present|current|now/i.test(m[2]);
  const start = parseYearMonth(m[1].replace(/sept/i, "sep"));
  if (!start) return null;
  return { start, end: present ? null : parseYearMonth(m[2].replace(/sept/i, "sep")), present, line: line.trim() };
}

/** How many lines after an employer's name a role's dates may sit in pasted profile text. */
const NEARBY_LINES = 6;

/**
 * Compares the Master Profile with text pasted from the user's own LinkedIn profile. The text
 * has no fixed layout, so this looks for each employer by name, then for a date range and the
 * job title close to it. What cannot be found is reported as "check", never as a conflict.
 */
export function compareLinkedInText(master: MasterProfile, text: string, source = "LinkedIn"): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (lines.length === 0) return findings;
  const whole = norm(lines.join("\n"));

  for (const role of master.experience) {
    const subject = roleLabel(role);
    const key = normalizeCompany(role.company);
    if (!key) continue;
    const at = lines.flatMap((line, i) => (norm(line).includes(key) || normalizeCompany(line.split(/[·|•]/)[0]) === key ? [i] : []));
    if (at.length === 0) {
      findings.push({ severity: "check", source, subject, field: "employer", message: "This employer was not found in the LinkedIn text. If the role is on your resume, add it to LinkedIn.", master: role.company });
      continue;
    }

    const windows = at.map((i) => lines.slice(Math.max(0, i - 2), i + NEARBY_LINES + 1));
    const title = norm(role.position);
    const ranges = windows.flatMap((w) => w.flatMap((l) => findRange(l) ?? []));
    const masterStart = parseYearMonth(role.startDate);
    const masterEnd = isPresent(role) ? null : parseYearMonth(role.endDate);

    if (ranges.length === 0) {
      findings.push({ severity: "check", source, subject, field: "dates", message: "No dates were found near this employer in the LinkedIn text.", master: rangeText(role) });
    } else {
      const matches = (r: TextRange) =>
        sameYearMonth(masterStart, r.start) !== false &&
        (isPresent(role) ? r.present : !r.present && sameYearMonth(masterEnd, r.end) !== false);
      if (!ranges.some(matches)) {
        // Several roles at one employer share its name: prefer the range beside this role's title.
        const beside = windows.flatMap((w) => w.flatMap((l, i) => (norm(l).includes(title) && title ? w.slice(i, i + 3).flatMap((x) => findRange(x) ?? []) : [])));
        const shown = beside[0] ?? ranges[0];
        findings.push({
          severity: "conflict", source, subject, field: "dates", message: "The dates differ.",
          master: rangeText(role),
          other: `${formatYearMonth(shown.start)} to ${shown.present ? "Present" : formatYearMonth(shown.end)}`,
        });
      }
    }

    if (title && !windows.some((w) => w.some((l) => norm(l).includes(title)))) {
      findings.push({ severity: whole.includes(title) ? "check" : "conflict", source, subject, field: "title", message: whole.includes(title) ? "This title appears in the LinkedIn text, but not next to this employer." : "This job title was not found in the LinkedIn text.", master: role.position });
    }
  }

  for (const edu of master.education) {
    if (norm(edu.school) && !whole.includes(norm(edu.school))) {
      findings.push({ severity: "check", source, subject: edu.school, field: "education", message: "This school was not found in the LinkedIn text.", master: edu.school });
    }
  }

  const city = norm(master.contact.location.split(",")[0]);
  if (city && !whole.includes(city)) {
    findings.push({ severity: "check", source, subject: "Your location", field: "location", message: "Your Master Profile location was not found in the LinkedIn text.", master: master.contact.location });
  }
  return findings;
}

// ---------------------------------------------------------------- report ---

export interface ConsistencyReport {
  findings: Finding[];
  conflicts: number;
  checks: number;
  /** Documents compared, with how many findings each produced. */
  sources: { source: string; findings: number }[];
}

export function buildReport(
  master: MasterProfile,
  resumes: { label: string; resume: Partial<MasterProfile> | null }[],
  linkedInText: string,
): ConsistencyReport {
  const groups: { source: string; findings: Finding[] }[] = resumes
    .filter((r) => r.resume)
    .map((r) => ({ source: r.label, findings: compareResume(master, r.resume, r.label) }));
  if (linkedInText.trim()) groups.push({ source: "LinkedIn", findings: compareLinkedInText(master, linkedInText) });
  const findings = groups.flatMap((g) => g.findings).sort((a, b) => Number(b.severity === "conflict") - Number(a.severity === "conflict"));
  return {
    findings,
    conflicts: findings.filter((f) => f.severity === "conflict").length,
    checks: findings.filter((f) => f.severity === "check").length,
    sources: groups.map((g) => ({ source: g.source, findings: g.findings.length })),
  };
}
