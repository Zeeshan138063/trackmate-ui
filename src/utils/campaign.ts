// Campaign setup (REQ-001, strategy spec 5A).
//
// A campaign is what the user is looking for and what limits them: role titles, regions, hard
// constraints and how much they can do in a day. Pure: shapes, cleaning and matching only.
// Stored one per user in `campaigns` (hooks/useCampaign.ts).

import { clampLimit, DEFAULT_LIMIT } from "./daily-queue";

export interface Campaign {
  /** Titles the user is applying for, e.g. "Backend Engineer". */
  roleTitles: string[];
  /** Countries or regions the user will work in, free text, e.g. "Germany", "EU". */
  regions: string[];
  remoteOk: boolean;
  /** Citizenships the user holds. */
  citizenships: string[];
  /** Languages the user can work in. */
  languages: string[];
  /** True when the user needs an employer to sponsor a work visa. */
  needsSponsorship: boolean;
  /** Total years of professional experience, or null when not given. */
  yearsExperience: number | null;
  /** Lowest yearly pay the user will accept, or null. Shown and stored; not yet used in scoring. */
  payFloor: number | null;
  payCurrency: string;
  /** YYYY-MM-DD, or null. */
  earliestStart: string | null;
  /** How many items a day the Today list shows. */
  dailyCapacity: number;
}

export const EMPTY_CAMPAIGN: Campaign = {
  roleTitles: [],
  regions: [],
  remoteOk: true,
  citizenships: [],
  languages: ["English"],
  needsSponsorship: false,
  yearsExperience: null,
  payFloor: null,
  payCurrency: "USD",
  earliestStart: null,
  dailyCapacity: DEFAULT_LIMIT,
};

export const MAX_LIST = 20;
export const MAX_ENTRY = 80;

/** "a, b;c\nd" -> ["a", "b", "c", "d"]: trimmed, no blanks, no repeats (case ignored), capped. */
export function parseList(text: string | string[] | null | undefined): string[] {
  const parts = Array.isArray(text) ? text : (text ?? "").split(/[,;\n]/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of parts) {
    const value = String(raw).trim().replace(/\s+/g, " ").slice(0, MAX_ENTRY);
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length === MAX_LIST) break;
  }
  return out;
}

function numberOrNull(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

/** Cleans anything typed in the form or read from the database into a valid campaign. */
export function normalizeCampaign(input: Partial<Record<keyof Campaign, unknown>>): Campaign {
  const start = typeof input.earliestStart === "string" && /^\d{4}-\d{2}-\d{2}/.test(input.earliestStart)
    ? input.earliestStart.slice(0, 10)
    : null;
  const currency = String(input.payCurrency ?? "").trim().toUpperCase();
  return {
    roleTitles: parseList(input.roleTitles as string[] | string),
    regions: parseList(input.regions as string[] | string),
    remoteOk: input.remoteOk === undefined ? EMPTY_CAMPAIGN.remoteOk : Boolean(input.remoteOk),
    citizenships: parseList(input.citizenships as string[] | string),
    languages: parseList(input.languages as string[] | string),
    needsSponsorship: Boolean(input.needsSponsorship),
    yearsExperience: numberOrNull(input.yearsExperience, 0, 60),
    payFloor: numberOrNull(input.payFloor, 0, 100_000_000),
    payCurrency: /^[A-Z]{3}$/.test(currency) ? currency : EMPTY_CAMPAIGN.payCurrency,
    earliestStart: start,
    dailyCapacity: clampLimit(input.dailyCapacity ?? DEFAULT_LIMIT),
  };
}

/** Database row (snake_case) <-> campaign. */
export interface CampaignRow {
  role_titles: string[] | null;
  regions: string[] | null;
  remote_ok: boolean | null;
  citizenships: string[] | null;
  languages: string[] | null;
  needs_sponsorship: boolean | null;
  years_experience: number | null;
  pay_floor: number | null;
  pay_currency: string | null;
  earliest_start: string | null;
  daily_capacity: number | null;
}

export function fromRow(row: Partial<CampaignRow>): Campaign {
  return normalizeCampaign({
    roleTitles: row.role_titles ?? [],
    regions: row.regions ?? [],
    remoteOk: row.remote_ok ?? undefined,
    citizenships: row.citizenships ?? [],
    languages: row.languages ?? [],
    needsSponsorship: row.needs_sponsorship ?? false,
    yearsExperience: row.years_experience,
    payFloor: row.pay_floor,
    payCurrency: row.pay_currency ?? undefined,
    earliestStart: row.earliest_start,
    dailyCapacity: row.daily_capacity ?? undefined,
  });
}

export function toRow(campaign: Campaign): CampaignRow {
  const c = normalizeCampaign(campaign);
  return {
    role_titles: c.roleTitles,
    regions: c.regions,
    remote_ok: c.remoteOk,
    citizenships: c.citizenships,
    languages: c.languages,
    needs_sponsorship: c.needsSponsorship,
    years_experience: c.yearsExperience,
    pay_floor: c.payFloor,
    pay_currency: c.payCurrency,
    earliest_start: c.earliestStart,
    daily_capacity: c.dailyCapacity,
  };
}

const SENIORITY = new Set(["senior", "sr", "junior", "jr", "lead", "staff", "principal", "mid", "ii", "iii", "i", "the", "of", "and"]);
const titleWords = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9+#.\s]/g, " ").split(/\s+/).map((w) => w.replace(/^\.+|\.+$/g, "")).filter((w) => w && !SENIORITY.has(w));

/**
 * True when a job title is one of the campaign's role titles: every word of some role title
 * (seniority words aside) appears in the job title. "Backend Engineer" matches "Senior Backend
 * Engineer (Payments)" and not "Frontend Engineer". An empty campaign matches nothing.
 */
export function titleMatches(campaign: Pick<Campaign, "roleTitles">, jobTitle: string | null | undefined): boolean {
  const job = new Set(titleWords(jobTitle ?? ""));
  if (job.size === 0) return false;
  return campaign.roleTitles.some((role) => {
    const wanted = titleWords(role);
    return wanted.length > 0 && wanted.every((w) => job.has(w));
  });
}

/** What is still missing before the campaign can drive matching. Empty when it is usable. */
export function campaignGaps(campaign: Campaign): string[] {
  const gaps: string[] = [];
  if (campaign.roleTitles.length === 0) gaps.push("Add at least one role title.");
  if (campaign.regions.length === 0 && !campaign.remoteOk) gaps.push("Add a region, or allow remote roles.");
  if (campaign.languages.length === 0) gaps.push("Add the languages you can work in.");
  return gaps;
}
