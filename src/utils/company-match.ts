// "Who do I know here?" (REQ-006, spec docs/specs/2026-11-26-who-do-i-know-here-design.md).
//
// Pure matching of contacts to a company by name. No network, no lookups: it only uses
// contacts the user already has in JobOS (P1, P9).

import { WARMTH_STAGES, type WarmthStage } from "./contact-next-action";

/** Words that do not distinguish one company from another. */
const SUFFIXES = new Set([
  "inc", "incorporated", "llc", "llp", "ltd", "limited", "gmbh", "ag", "sa", "bv", "corp", "corporation",
  "co", "company", "plc", "pvt", "private", "pte", "group", "holdings", "technologies", "technology",
]);

/** Lower-case words of a company name with punctuation, a leading "the" and suffixes removed. */
export function companyWords(name: string | null | undefined): string[] {
  if (!name) return [];
  const words = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  if (words[0] === "the") words.shift();
  while (words.length > 1 && SUFFIXES.has(words[words.length - 1])) words.pop();
  return words;
}

export function normalizeCompany(name: string | null | undefined): string {
  return companyWords(name).join(" ");
}

export type MatchKind = "exact" | "possible";

/**
 * exact: the normalised names are equal.
 * possible: one name's words are the leading words of the other ("Google", "Google Cloud").
 * null: anything else, including an empty name on either side.
 */
export function matchCompany(a: string | null | undefined, b: string | null | undefined): MatchKind | null {
  const wa = companyWords(a);
  const wb = companyWords(b);
  if (wa.length === 0 || wb.length === 0) return null;
  const [short, long] = wa.length <= wb.length ? [wa, wb] : [wb, wa];
  if (!short.every((word, i) => long[i] === word)) return null;
  return short.length === long.length ? "exact" : "possible";
}

export interface MatchableContact {
  id: string;
  name: string;
  company?: string | null;
  warmth_stage?: WarmthStage;
  relationship_stage?: string | null;
}

export interface CompanyMatch<T extends MatchableContact> {
  contact: T;
  kind: MatchKind;
  doNotContact: boolean;
}

const stageRank = (stage: WarmthStage | undefined) => WARMTH_STAGES.indexOf(stage ?? "identified");

/**
 * The user's contacts at a company: exact matches before possible ones, warmest first, then by
 * name; do-not-contact contacts last (AC-1, AC-4).
 */
export function contactsAtCompany<T extends MatchableContact>(company: string | null | undefined, contacts: T[]): CompanyMatch<T>[] {
  const matches: CompanyMatch<T>[] = [];
  for (const contact of contacts) {
    const kind = matchCompany(company, contact.company);
    if (kind) matches.push({ contact, kind, doNotContact: contact.relationship_stage === "do_not_contact" });
  }
  return matches.sort((a, b) =>
    Number(a.doNotContact) - Number(b.doNotContact) ||
    (a.kind === b.kind ? 0 : a.kind === "exact" ? -1 : 1) ||
    stageRank(b.contact.warmth_stage) - stageRank(a.contact.warmth_stage) ||
    a.contact.name.localeCompare(b.contact.name)
  );
}

/** People definitely at the company whom the user may contact. This is the number on a job (DEC-004). */
export function countContactable<T extends MatchableContact>(matches: CompanyMatch<T>[]): number {
  return matches.filter((m) => m.kind === "exact" && !m.doNotContact).length;
}

/** Stages warm enough to ask for a referral (DEC-007): the threshold the strategy spec names. */
const REFERRAL_STAGES: ReadonlySet<WarmthStage> = new Set(["in_conversation", "advocate"]);

/**
 * People the user could ask before applying cold (REQ-007): definitely at the company, may be
 * contacted, and already In conversation or an Advocate. Advocates first.
 */
export function referralCandidates<T extends MatchableContact>(company: string | null | undefined, contacts: T[]): T[] {
  return contactsAtCompany(company, contacts)
    .filter((m) => m.kind === "exact" && !m.doNotContact && REFERRAL_STAGES.has(m.contact.warmth_stage ?? "identified"))
    .map((m) => m.contact);
}
