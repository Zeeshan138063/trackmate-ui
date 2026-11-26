// Helpers for the Connections page: search, sort, duplicate detection, safe links and the
// contact the Chrome extension hands over. Pure; tested in contact-list.test.ts.

import type { Contact } from "@/types/contact";
import { normalizeCompany } from "./company-match";

const lower = (v: string | null | undefined) => (v ?? "").toLowerCase();

/** True when every word of the query appears somewhere in the contact's searchable text. */
export function matchesQuery(contact: Contact, query: string): boolean {
  const words = lower(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [contact.name, contact.company, contact.position, contact.email, contact.relationship, contact.notes, contact.address, contact.country]
    .map(lower).join(" \n ");
  return words.every((w) => haystack.includes(w));
}

export function matchesLocation(contact: Contact, query: string): boolean {
  const q = lower(query).trim();
  return !q || lower(contact.address).includes(q) || lower(contact.country).includes(q);
}

export const CONTACT_SORTS = ["next", "name", "recent", "company"] as const;
export type ContactSort = (typeof CONTACT_SORTS)[number];
export const SORT_LABELS: Record<ContactSort, string> = {
  next: "Next step due",
  name: "Name",
  recent: "Recently added",
  company: "Company",
};

/**
 * Sorted copy. "next" puts contacts with a due step first, most overdue first, then the rest by
 * name. `dueDates` maps contact id to the next step's date (YYYY-MM-DD); contacts with nothing to
 * do are absent.
 */
export function sortContacts(contacts: Contact[], sort: ContactSort, dueDates: Map<string, string> = new Map()): Contact[] {
  const byName = (a: Contact, b: Contact) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  const list = [...contacts];
  switch (sort) {
    case "name":
      return list.sort(byName);
    case "recent":
      return list.sort((a, b) => lower(b.created_at).localeCompare(lower(a.created_at)) || byName(a, b));
    case "company":
      return list.sort((a, b) => {
        // Contacts with no company go last.
        if (!a.company !== !b.company) return a.company ? -1 : 1;
        return lower(a.company).localeCompare(lower(b.company)) || byName(a, b);
      });
    case "next":
      return list.sort((a, b) => {
        const da = dueDates.get(a.id);
        const db = dueDates.get(b.id);
        if (!da !== !db) return da ? -1 : 1;
        return (da ?? "").localeCompare(db ?? "") || byName(a, b);
      });
  }
}

/** "https://www.linkedin.com/in/Jane-Doe/?utm=x" -> "linkedin.com/in/jane-doe". Empty when not a profile link. */
export function linkedInKey(url: string | null | undefined): string {
  const m = lower(url).trim().match(/linkedin\.com\/(in|pub)\/([^/?#\s]+)/);
  return m ? `linkedin.com/in/${decodeURIComponent(m[2])}` : "";
}

export interface DuplicateMatch {
  contact: Contact;
  /** What matched, for the message shown to the user. */
  why: "LinkedIn profile" | "email" | "name and company";
}

/** An existing contact that is probably the same person, or null. `ignoreId` skips the contact being edited. */
export function findDuplicate(
  candidate: Pick<Contact, "name" | "company" | "email" | "linkedin_url">,
  contacts: Contact[],
  ignoreId?: string,
): DuplicateMatch | null {
  const key = linkedInKey(candidate.linkedin_url);
  const email = lower(candidate.email).trim();
  const name = lower(candidate.name).replace(/\s+/g, " ").trim();
  const company = normalizeCompany(candidate.company);
  for (const contact of contacts) {
    if (contact.id === ignoreId) continue;
    if (key && linkedInKey(contact.linkedin_url) === key) return { contact, why: "LinkedIn profile" };
    if (email && lower(contact.email).trim() === email) return { contact, why: "email" };
    if (name && company && lower(contact.name).replace(/\s+/g, " ").trim() === name && normalizeCompany(contact.company) === company) {
      return { contact, why: "name and company" };
    }
  }
  return null;
}

/** The URL when it is a plain http(s) link, otherwise null. Stored links come from users and the extension: never render them unchecked. */
export function safeHttpUrl(url: string | null | undefined): string | null {
  const value = (url ?? "").trim();
  if (!value) return null;
  try {
    const parsed = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * The contact form's starting values for a hand-off from the Chrome extension. `data` is what the
 * extension stored; `params` are the few values it also puts in the URL, used when the data does
 * not arrive. Returns null when there is no name at all.
 */
export function importedContact(data: Record<string, unknown> | null | undefined, params?: URLSearchParams): Partial<Contact> | null {
  const d = data ?? {};
  const name = text(d.name, 120) || text(params?.get("name"), 120);
  if (!name) return null;
  return {
    name,
    company: text(d.company, 120) || text(params?.get("company"), 120),
    position: text(d.position, 160) || text(d.headline, 160),
    address: text(d.location, 160) || text(d.address, 160),
    notes: text(d.notes, 2000) || text(d.about, 2000),
    relationship: text(d.relationship, 120),
    email: text(d.email, 200),
    phone: text(d.phone, 60),
    linkedin_url: safeHttpUrl(text(d.linkedin_url, 300) || text(d.profileUrl, 300)) ?? "",
  };
}
