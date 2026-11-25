// Job intake from the public job-board feeds that applicant-tracking systems publish for
// exactly this purpose. Pure functions only (no Deno APIs, no network) so they can be tested.
//
// Sources (decision DEC-001, answering OQ-01):
//   Greenhouse  GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
//   Lever       GET https://api.lever.co/v0/postings/{site}?mode=json   (EU: api.eu.lever.co)
//   Ashby       GET https://api.ashbyhq.com/posting-api/job-board/{name}
// JobOS does not fetch LinkedIn and does not scrape search engines (principle P1).

export type Ats = "greenhouse" | "lever" | "ashby";

export interface Board {
  ats: Ats;
  token: string;
  /** Lever hosts some customers in the EU on a separate domain. */
  eu?: boolean;
}

export interface FeedJob {
  external_id: string;
  title: string;
  company: string;
  location: string | null;
  job_url: string;
  /** The date the employer published the posting, or null when the feed does not say. */
  posted_at: string | null;
  description: string | null;
  source: string;
}

const TOKEN = /^[A-Za-z0-9][A-Za-z0-9._%-]{0,99}$/;

/** Reads the board out of a company's careers page URL. Returns null for anything else. */
export function parseBoard(careersUrl: string | null | undefined): Board | null {
  if (!careersUrl) return null;
  let url: URL;
  try {
    url = new URL(careersUrl.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);

  let board: Board | null = null;
  if (host === "boards.greenhouse.io" || host === "job-boards.greenhouse.io" || host === "boards.eu.greenhouse.io") {
    const embedded = parts[0] === "embed" ? url.searchParams.get("for") : null;
    const token = embedded ?? parts[0];
    if (token) board = { ats: "greenhouse", token };
  } else if (host === "jobs.lever.co" || host === "jobs.eu.lever.co") {
    if (parts[0]) board = { ats: "lever", token: parts[0], ...(host === "jobs.eu.lever.co" ? { eu: true } : {}) };
  } else if (host === "jobs.ashbyhq.com") {
    if (parts[0]) board = { ats: "ashby", token: decodeURIComponent(parts[0]) };
  }
  if (!board || !TOKEN.test(board.token)) return null;
  return board;
}

export function boardKey(b: Board): string {
  return `${b.ats}:${b.token.toLowerCase()}`;
}

export function feedUrl(b: Board): string {
  const token = encodeURIComponent(b.token);
  switch (b.ats) {
    case "greenhouse":
      return `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`;
    case "lever":
      return `https://${b.eu ? "api.eu.lever.co" : "api.lever.co"}/v0/postings/${token}?mode=json`;
    case "ashby":
      return `https://api.ashbyhq.com/posting-api/job-board/${token}`;
  }
}

/** Turns an HTML fragment (possibly entity-escaped, as Greenhouse sends it) into plain text. */
export function toPlainText(html: string | null | undefined, max = 4000): string | null {
  if (!html) return null;
  const decoded = html
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  const text = decoded
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.slice(0, max) : null;
}

function isoOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Normalises a feed response. Anything that is not the expected shape yields no jobs rather
 * than a guess. `company` is the name on the user's watchlist: the feeds do not all carry one.
 */
// deno-lint-ignore no-explicit-any
export function normalize(board: Board, company: string, payload: any): FeedJob[] {
  const out: FeedJob[] = [];
  const push = (id: unknown, title: unknown, url: unknown, location: unknown, posted: unknown, description: string | null) => {
    const t = str(title), u = str(url);
    if (id === null || id === undefined || !t || !/^https:\/\//.test(u)) return;
    out.push({
      external_id: `${board.ats}:${board.token.toLowerCase()}:${id}`,
      title: t,
      company,
      location: str(location) || null,
      job_url: u,
      posted_at: isoOrNull(posted),
      description,
      source: board.ats,
    });
  };

  if (board.ats === "greenhouse") {
    for (const j of Array.isArray(payload?.jobs) ? payload.jobs : []) {
      // updated_at changes on every edit, so it is not a posting date. Only first_published is.
      push(j?.id, j?.title, j?.absolute_url, j?.location?.name, j?.first_published, toPlainText(j?.content));
    }
  } else if (board.ats === "lever") {
    for (const j of Array.isArray(payload) ? payload : []) {
      push(j?.id, j?.text, j?.hostedUrl, j?.categories?.location, j?.createdAt, toPlainText(j?.descriptionPlain ?? j?.description));
    }
  } else {
    for (const j of Array.isArray(payload?.jobs) ? payload.jobs : []) {
      if (j?.isListed === false) continue;
      push(j?.id, j?.title, j?.jobUrl, j?.location, j?.publishedAt, toPlainText(j?.descriptionPlain ?? j?.descriptionHtml));
    }
  }
  return out;
}

/**
 * True when every word of at least one keyword appears in the title. With no keywords at all,
 * nothing matches: intake is driven by what users are searching for.
 */
export function matchesAnyKeyword(title: string, keywords: string[]): boolean {
  const hay = ` ${title.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ")} `;
  return keywords.some((k) => {
    const words = k.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").split(" ").filter(Boolean);
    return words.length > 0 && words.every((w) => hay.includes(` ${w} `));
  });
}

/** First matching keyword, stored on the row so searches by keyword still find it. */
export function firstMatchingKeyword(title: string, keywords: string[]): string | null {
  return keywords.find((k) => matchesAnyKeyword(title, [k])) ?? null;
}
