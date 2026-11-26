import { describe, expect, it } from "vitest";
import type { Contact } from "@/types/contact";
import { findDuplicate, importedContact, linkedInKey, matchesLocation, matchesQuery, safeHttpUrl, sortContacts } from "./contact-list";

const c = (id: string, over: Partial<Contact> = {}): Contact => ({ id, user_id: "u", name: `Person ${id}`, ...over });

describe("search", () => {
  const amna = c("1", { name: "Amna Khan", company: "Acme", position: "Engineering Manager", notes: "Met at PyCon", email: "amna@acme.io", country: "Germany" });

  it("matches every word across name, company, role, email, relationship and notes", () => {
    expect(matchesQuery(amna, "amna acme")).toBe(true);
    expect(matchesQuery(amna, "pycon")).toBe(true);
    expect(matchesQuery(amna, "ACME.IO")).toBe(true);
    expect(matchesQuery(amna, "amna globex")).toBe(false);
    expect(matchesQuery(amna, "   ")).toBe(true);
  });

  it("filters by address or country", () => {
    expect(matchesLocation(amna, "germ")).toBe(true);
    expect(matchesLocation(amna, "france")).toBe(false);
    expect(matchesLocation(amna, "")).toBe(true);
  });
});

describe("sortContacts", () => {
  const list = [
    c("1", { name: "Zed", company: "Beta", created_at: "2026-01-01" }),
    c("2", { name: "amy", company: undefined, created_at: "2026-03-01" }),
    c("3", { name: "Bob", company: "alpha", created_at: "2026-02-01" }),
  ];
  const ids = (s: Parameters<typeof sortContacts>[1], due?: Map<string, string>) => sortContacts(list, s, due).map((x) => x.id);

  it("sorts by name, newest and company without changing the input", () => {
    expect(ids("name")).toEqual(["2", "3", "1"]);
    expect(ids("recent")).toEqual(["2", "3", "1"]);
    expect(ids("company")).toEqual(["3", "1", "2"]);
    expect(list.map((x) => x.id)).toEqual(["1", "2", "3"]);
  });

  it("puts due steps first, most overdue first, then the rest by name", () => {
    expect(ids("next", new Map([["1", "2026-11-20"], ["3", "2026-11-10"]]))).toEqual(["3", "1", "2"]);
    expect(ids("next")).toEqual(["2", "3", "1"]);
  });
});

describe("duplicates", () => {
  const existing = [
    c("1", { name: "Amna Khan", company: "Acme Inc.", linkedin_url: "https://www.linkedin.com/in/Amna-Khan/?utm=x", email: "amna@acme.io" }),
    c("2", { name: "Bilal Ahmed", company: "Globex" }),
  ];

  it("reads a profile key from a LinkedIn link", () => {
    expect(linkedInKey("https://www.linkedin.com/in/Amna-Khan/?utm=x")).toBe("linkedin.com/in/amna-khan");
    expect(linkedInKey("linkedin.com/in/amna-khan")).toBe("linkedin.com/in/amna-khan");
    expect(linkedInKey("https://example.com/in/x")).toBe("");
  });

  it("matches on LinkedIn profile, then email, then name with company", () => {
    expect(findDuplicate({ name: "A. Khan", linkedin_url: "https://linkedin.com/in/amna-khan" }, existing)?.why).toBe("LinkedIn profile");
    expect(findDuplicate({ name: "Someone", email: " AMNA@acme.io " }, existing)?.why).toBe("email");
    expect(findDuplicate({ name: "bilal  ahmed", company: "Globex Ltd" }, existing)?.contact.id).toBe("2");
  });

  it("does not match on name alone, or the contact being edited", () => {
    expect(findDuplicate({ name: "Bilal Ahmed", company: "Initech" }, existing)).toBeNull();
    expect(findDuplicate({ name: "Bilal Ahmed" }, existing)).toBeNull();
    expect(findDuplicate({ name: "Bilal Ahmed", company: "Globex" }, existing, "2")).toBeNull();
  });
});

describe("safeHttpUrl", () => {
  it("allows http and https, adds https to a bare host, and rejects everything else", () => {
    expect(safeHttpUrl("https://linkedin.com/in/x")).toBe("https://linkedin.com/in/x");
    expect(safeHttpUrl("linkedin.com/in/x")).toBe("https://linkedin.com/in/x");
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("data:text/html,x")).toBeNull();
    expect(safeHttpUrl("  ")).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
  });
});

describe("importedContact", () => {
  it("maps what the extension stored onto the contact form", () => {
    expect(importedContact({ name: " Amna Khan ", company: "Acme", headline: "EM at Acme", location: "Berlin", about: "Builds teams", linkedin_url: "https://www.linkedin.com/in/amna" })).toEqual({
      name: "Amna Khan", company: "Acme", position: "EM at Acme", address: "Berlin", notes: "Builds teams", relationship: "", email: "", phone: "", linkedin_url: "https://www.linkedin.com/in/amna",
    });
  });

  it("falls back to the URL values, drops unsafe links and non-text values, and needs a name", () => {
    const params = new URLSearchParams("name=Amna&company=Acme");
    expect(importedContact(null, params)).toMatchObject({ name: "Amna", company: "Acme", linkedin_url: "" });
    expect(importedContact({ name: "X", linkedin_url: "javascript:alert(1)", company: 42 })).toMatchObject({ linkedin_url: "", company: "" });
    expect(importedContact({ company: "Acme" })).toBeNull();
    expect(importedContact({ name: "x".repeat(500) })?.name).toHaveLength(120);
  });
});
