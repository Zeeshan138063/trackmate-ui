// Fit caps and freshness (REQ-008, strategy spec 5C).
//
// Pure. Reads hard requirements out of a job posting's own words and compares them with the
// user's campaign. A cap means "this posting says something that rules you out"; it is shown
// with the sentence it came from, so the user can judge it. Nothing here is a score from a model.

import { titleMatches, type Campaign } from "./campaign";

export type CapKind = "citizenship" | "sponsorship" | "language" | "experience";

export interface JobConstraints {
  /** The posting restricts the role to citizens or nationals. `countries` is empty when it does not say of where. */
  citizenship: { countries: string[]; evidence: string } | null;
  /** The posting says no visa sponsorship, or requires existing work authorisation. */
  noSponsorship: { evidence: string } | null;
  /** Languages the posting requires at a working level. */
  languages: { language: string; evidence: string }[];
  /** The lowest "N+ years" the posting requires. */
  minYears: { years: number; evidence: string } | null;
}

export interface FitCap {
  kind: CapKind;
  /** Short label for a badge. */
  label: string;
  /** Why, in a sentence, for the user. */
  reason: string;
  /** The posting's own words. */
  evidence: string;
}

const LANGUAGES = [
  "English", "German", "French", "Spanish", "Italian", "Dutch", "Portuguese", "Arabic", "Mandarin", "Chinese", "Japanese",
  "Korean", "Swedish", "Norwegian", "Danish", "Finnish", "Polish", "Turkish", "Hebrew", "Hindi", "Urdu", "Russian", "Czech", "Greek",
];

/** Demonym or country word -> the country name used for comparison. */
const NATIONALITIES: Record<string, string> = {
  us: "United States", "u.s": "United States", usa: "United States", american: "United States", "united states": "United States",
  uk: "United Kingdom", british: "United Kingdom", "united kingdom": "United Kingdom",
  saudi: "Saudi Arabia", "saudi arabia": "Saudi Arabia", ksa: "Saudi Arabia",
  emirati: "United Arab Emirates", uae: "United Arab Emirates",
  canadian: "Canada", canada: "Canada", australian: "Australia", australia: "Australia",
  german: "Germany", germany: "Germany", french: "France", france: "France", indian: "India", india: "India",
  qatari: "Qatar", kuwaiti: "Kuwait", omani: "Oman", bahraini: "Bahrain", eu: "EU", european: "EU",
};

const sentences = (text: string) =>
  text.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").split(/(?<=[.!?])\s+|\n+|•|·|;/).map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);

const clip = (s: string) => (s.length > 200 ? `${s.slice(0, 197)}...` : s);

const CITIZEN = /\b(citizens?|nationals?|citizenship)\b/i;
const CITIZEN_ONLY = /\b(only|must be|must hold|must have|required|requires?|restricted to|limited to|open to|eligib\w+)\b/i;
const NO_SPONSOR = /\b(no|not|unable to|cannot|can ?not|won'?t|will not|do not|does not|don'?t|doesn'?t|without)\b[^.]{0,60}\b(sponsor\w*|visa support)\b|\b(sponsorship is not|sponsorship (?:is )?unavailable)\b/i;
const WORK_AUTH = /\b(must (?:already )?(?:have|hold|possess)|existing|valid|current)\b[^.]{0,40}\b(right to work|work authori[sz]ation|work permit|authori[sz]ed to work)\b/i;
const LANGUAGE_NEED = /\b(fluen\w+|native|proficien\w+|required|must|mandatory|essential|business[- ]level|c1|c2|working knowledge)\b/i;
const LANGUAGE_SOFT = /\b(nice to have|a plus|is a bonus|bonus|preferred|advantage|desirable|optional|beneficial)\b/i;
const YEARS = /\b(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?(?:years?|yrs?)\b/gi;
const YEARS_NEED = /\b(experience|minimum|at least|required|must)\b/i;

/** Reads hard requirements from a posting. Finds only what the text states; an empty result means "nothing found", not "no requirements". */
export function extractConstraints(text: string | null | undefined): JobConstraints {
  const out: JobConstraints = { citizenship: null, noSponsorship: null, languages: [], minYears: null };
  for (const sentence of sentences(text ?? "")) {
    if (!out.citizenship && CITIZEN.test(sentence) && CITIZEN_ONLY.test(sentence) && !/\bregardless\b|\bwithout regard\b|\bequal opportunity\b|\bnational origin\b/i.test(sentence)) {
      const lower = ` ${sentence.toLowerCase().replace(/[^a-z.\s]/g, " ")} `;
      const countries = new Set<string>();
      for (const [word, country] of Object.entries(NATIONALITIES)) {
        if (lower.includes(` ${word} `) || lower.includes(` ${word}. `)) countries.add(country);
      }
      out.citizenship = { countries: [...countries], evidence: clip(sentence) };
    }

    if (!out.noSponsorship && (NO_SPONSOR.test(sentence) || WORK_AUTH.test(sentence))) {
      out.noSponsorship = { evidence: clip(sentence) };
    }

    if (LANGUAGE_NEED.test(sentence) && !LANGUAGE_SOFT.test(sentence)) {
      for (const language of LANGUAGES) {
        // "German" the nationality also appears in citizenship lines: require a language cue nearby.
        const near = new RegExp(`\\b(fluen\\w+|native|proficien\\w+|speak\\w*|written|spoken|language|c1|c2)\\b[^.]{0,40}\\b${language}\\b|\\b${language}\\b[^.]{0,40}\\b(fluen\\w+|native|proficien\\w+|speak\\w*|skills?|language|required|mandatory|c1|c2)\\b`, "i");
        if (near.test(sentence) && !out.languages.some((l) => l.language === language)) {
          out.languages.push({ language, evidence: clip(sentence) });
        }
      }
    }

    if (YEARS_NEED.test(sentence)) {
      for (const match of sentence.matchAll(YEARS)) {
        const years = Number(match[1]);
        if (years >= 1 && years <= 40 && (!out.minYears || years > out.minYears.years)) {
          out.minYears = { years, evidence: clip(sentence) };
        }
      }
    }
  }
  return out;
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const countryOf = (value: string) => NATIONALITIES[value.trim().toLowerCase()] ?? value.trim();

/** How far short of the stated years still counts as worth a look. */
export const YEARS_GRACE = 2;

/** Hard caps: what the posting states that the campaign cannot meet. Empty when nothing rules the user out. */
export function fitCaps(constraints: JobConstraints, campaign: Campaign): FitCap[] {
  const caps: FitCap[] = [];

  if (constraints.citizenship) {
    const { countries, evidence } = constraints.citizenship;
    const held = campaign.citizenships.map(countryOf);
    const holdsOne = countries.some((c) => held.some((h) => same(h, c)));
    // Unknown country: cap only when the user has told us they need sponsorship (so they are not a local national).
    if (countries.length > 0 ? !holdsOne : campaign.needsSponsorship) {
      caps.push({
        kind: "citizenship",
        label: countries.length ? `${countries.join(" or ")} citizens only` : "Citizens only",
        reason: countries.length
          ? `The posting is limited to ${countries.join(" or ")} citizens, and your campaign does not list that citizenship.`
          : "The posting is limited to citizens or nationals, and your campaign says you need sponsorship.",
        evidence,
      });
    }
  }

  if (constraints.noSponsorship && campaign.needsSponsorship) {
    caps.push({ kind: "sponsorship", label: "No sponsorship", reason: "The posting offers no visa sponsorship, and your campaign says you need it.", evidence: constraints.noSponsorship.evidence });
  }

  for (const { language, evidence } of constraints.languages) {
    const known = campaign.languages.some((l) => same(l, language) || (language === "Mandarin" && same(l, "Chinese")) || (language === "Chinese" && same(l, "Mandarin")));
    if (!known && campaign.languages.length > 0) {
      caps.push({ kind: "language", label: `Requires ${language}`, reason: `The posting requires ${language}, which is not in your campaign's languages.`, evidence });
    }
  }

  if (constraints.minYears && campaign.yearsExperience !== null && constraints.minYears.years - campaign.yearsExperience > YEARS_GRACE) {
    caps.push({
      kind: "experience",
      label: `Needs ${constraints.minYears.years}+ years`,
      reason: `The posting asks for ${constraints.minYears.years} or more years; your campaign says ${campaign.yearsExperience}.`,
      evidence: constraints.minYears.evidence,
    });
  }
  return caps;
}

export interface FoundJob {
  id: string;
  title: string;
  company: string;
  description?: string | null;
  jobUrl?: string | null;
  postedAt?: string | null;
  firstSeenAt?: string | null;
}

export interface JobFit {
  titleMatch: boolean;
  caps: FitCap[];
  /** A role the user wants with nothing in the posting ruling them out. */
  highFit: boolean;
}

export function assessFit(job: Pick<FoundJob, "title" | "description">, campaign: Campaign): JobFit {
  const caps = fitCaps(extractConstraints(job.description), campaign);
  const titleMatch = titleMatches(campaign, job.title);
  return { titleMatch, caps, highFit: titleMatch && caps.length === 0 };
}

export const FRESH_HOURS = 48;

/** Hours since the posting was published, or since JobOS first saw it when the source gives no date. Null when neither is known. */
export function ageHours(job: Pick<FoundJob, "postedAt" | "firstSeenAt">, now: Date): number | null {
  const stamp = job.postedAt ?? job.firstSeenAt;
  if (!stamp) return null;
  const t = new Date(stamp).getTime();
  return Number.isFinite(t) ? (now.getTime() - t) / 3_600_000 : null;
}

export function isFresh(job: Pick<FoundJob, "postedAt" | "firstSeenAt">, now: Date): boolean {
  const age = ageHours(job, now);
  return age !== null && age >= 0 && age <= FRESH_HOURS;
}

const normUrl = (url: string | null | undefined) => (url ?? "").trim().toLowerCase().replace(/[?#].*$/, "").replace(/\/+$/, "");

/**
 * Found jobs for the top of today's queue: fresh, a wanted title, no cap, and not already on the
 * user's tracker (same posting URL, or same title at the same company). Newest first.
 */
export function freshHighFit(
  found: FoundJob[],
  campaign: Campaign,
  tracked: { position: string; company: string; jobUrl?: string | null }[],
  now: Date,
): FoundJob[] {
  const urls = new Set(tracked.map((t) => normUrl(t.jobUrl)).filter(Boolean));
  const titles = new Set(tracked.map((t) => `${t.position}|${t.company}`.toLowerCase()));
  return found
    .filter((job) => isFresh(job, now))
    .filter((job) => !(job.jobUrl && urls.has(normUrl(job.jobUrl))) && !titles.has(`${job.title}|${job.company}`.toLowerCase()))
    .filter((job) => assessFit(job, campaign).highFit)
    .sort((a, b) => (ageHours(a, now) ?? 0) - (ageHours(b, now) ?? 0));
}
