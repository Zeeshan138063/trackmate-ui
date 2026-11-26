// Import of LinkedIn's own "Connections.csv" data export.
//
// The user downloads the file from LinkedIn (Settings > Data privacy > Get a copy of your data)
// and picks it here. JobOS reads the file in the browser; it never signs in to or reads LinkedIn
// (P1). Pure: parsing and planning only.

import type { Contact } from "@/types/contact";
import { findDuplicate, safeHttpUrl } from "./contact-list";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_ROWS = 5000;

/** RFC 4180 CSV: quoted fields, doubled quotes, commas and line breaks inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // drop a byte order mark
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += ch;
    } else if (ch === '"' && field === "") quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

export interface ImportRow {
  /** Position in the file, for a stable key. */
  index: number;
  name: string;
  company: string;
  position: string;
  email: string;
  linkedin_url: string;
  /** As written in the file, e.g. "12 Mar 2024". */
  connectedOn: string;
}

export interface ParsedConnections {
  rows: ImportRow[];
  /** Lines with no name, which cannot become contacts. */
  skipped: number;
  /** True when the file had more rows than MAX_ROWS and the rest were left out. */
  truncated: boolean;
  /** Set when the file is not a LinkedIn connections export. */
  error: string | null;
}

const clean = (v: string | undefined, max: number) => (v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
/** A leading =, +, - or @ would run as a formula if the user later opens their export in a spreadsheet. */
const defuse = (v: string) => v.replace(/^[=+\-@\t\r]+/, "").trim();

/** Reads LinkedIn's Connections.csv. The file starts with a few lines of notes before the header row. */
export function parseConnectionsCsv(text: string): ParsedConnections {
  const empty = { rows: [], skipped: 0, truncated: false };
  const table = parseCsv(text);
  const headerAt = table.findIndex((r) => {
    const cells = r.map((c) => c.trim().toLowerCase());
    return cells.includes("first name") && cells.includes("last name");
  });
  if (headerAt === -1) {
    return { ...empty, error: 'This does not look like LinkedIn\'s Connections.csv. It should have "First Name" and "Last Name" columns.' };
  }
  const header = table[headerAt].map((c) => c.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const at = { first: col("first name"), last: col("last name"), url: col("url"), email: col("email address"), company: col("company"), position: col("position"), on: col("connected on") };

  const rows: ImportRow[] = [];
  let skipped = 0;
  let truncated = false;
  for (let i = headerAt + 1; i < table.length; i++) {
    const r = table[i];
    if (r.every((c) => !c.trim())) continue;
    const name = defuse(clean(`${r[at.first] ?? ""} ${r[at.last] ?? ""}`, 120));
    if (!name) { skipped++; continue; }
    if (rows.length === MAX_ROWS) { truncated = true; break; }
    const email = clean(r[at.email], 200);
    rows.push({
      index: i,
      name,
      company: defuse(clean(r[at.company], 120)),
      position: defuse(clean(r[at.position], 160)),
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "",
      linkedin_url: safeHttpUrl(clean(r[at.url], 300)) ?? "",
      connectedOn: clean(r[at.on], 40),
    });
  }
  return { rows, skipped, truncated, error: rows.length === 0 ? "No connections were found in this file." : null };
}

export interface ImportPlan {
  /** Rows that are new. */
  fresh: ImportRow[];
  /** Rows that match a contact the user already has, or an earlier row of the same file. */
  duplicates: { row: ImportRow; existingName: string; why: string }[];
}

/** Splits rows into new people and probable duplicates of existing contacts or of each other. */
export function planImport(rows: ImportRow[], existing: Contact[]): ImportPlan {
  const plan: ImportPlan = { fresh: [], duplicates: [] };
  const known: Contact[] = [...existing];
  for (const row of rows) {
    const match = findDuplicate(row, known);
    if (match) {
      plan.duplicates.push({ row, existingName: match.contact.name, why: match.why });
      continue;
    }
    plan.fresh.push(row);
    known.push({ id: `import:${row.index}`, user_id: "", name: row.name, company: row.company, email: row.email, linkedin_url: row.linkedin_url });
  }
  return plan;
}

/**
 * The contact to insert for a row. Imported people are already connections, so they start at
 * Connected. Notes and relationship stay empty on purpose: message drafts are built from what
 * the user writes about a person, and an import knows nothing personal.
 */
export function toContact(row: ImportRow): Pick<Contact, "name" | "company" | "position" | "email" | "linkedin_url" | "warmth_stage"> {
  return { name: row.name, company: row.company, position: row.position, email: row.email, linkedin_url: row.linkedin_url, warmth_stage: "connected" };
}

/** Case-insensitive match on name, company or position, for the preview's search box. */
export function rowMatches(row: ImportRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  return !q || `${row.name}\n${row.company}\n${row.position}`.toLowerCase().includes(q);
}
