import { describe, expect, it } from "vitest";
import { contactsAtCompany, countContactable, matchCompany, normalizeCompany, referralCandidates } from "./company-match";

describe("AC-2 normalising", () => {
  it("ignores case, punctuation, a leading 'the' and legal suffixes", () => {
    expect(normalizeCompany("Acme, Inc.")).toBe("acme");
    expect(normalizeCompany("ACME")).toBe("acme");
    expect(normalizeCompany("The Acme Company Ltd")).toBe("acme");
    expect(normalizeCompany("Systems Limited")).toBe("systems");
    expect(normalizeCompany("Careem Technologies Pvt. Ltd.")).toBe("careem");
    expect(normalizeCompany("AT&T")).toBe("at and t");
    expect(normalizeCompany("Nestlé")).toBe("nestle");
    expect(normalizeCompany("")).toBe("");
    expect(normalizeCompany(null)).toBe("");
  });

  it("keeps a name that is only a suffix word", () => {
    expect(normalizeCompany("Group")).toBe("group");
  });
});

describe("AC-3 match kinds", () => {
  it("exact when the normalised names are equal", () => {
    expect(matchCompany("Acme, Inc.", "ACME")).toBe("exact");
    expect(matchCompany("Saudi Aramco", "saudi aramco")).toBe("exact");
  });

  it("possible when one name's words lead the other", () => {
    expect(matchCompany("Google", "Google Cloud")).toBe("possible");
    expect(matchCompany("Amazon Web Services", "Amazon")).toBe("possible");
  });

  it("nothing else matches", () => {
    expect(matchCompany("Meta", "Metabase")).toBeNull();
    expect(matchCompany("National Bank", "National Grid")).toBeNull();
    expect(matchCompany("Cloud", "Google Cloud")).toBeNull(); // not the leading word
    expect(matchCompany("", "Acme")).toBeNull();
    expect(matchCompany("Acme", null)).toBeNull();
    expect(matchCompany(undefined, undefined)).toBeNull();
  });
});

describe("AC-1 and AC-4 contactsAtCompany", () => {
  const contacts = [
    { id: "1", name: "Zed", company: "Acme Inc", warmth_stage: "identified" as const },
    { id: "2", name: "Amna", company: "ACME", warmth_stage: "advocate" as const },
    { id: "3", name: "Bob", company: "Acme Robotics", warmth_stage: "advocate" as const },
    { id: "4", name: "Dnc", company: "Acme", warmth_stage: "advocate" as const, relationship_stage: "do_not_contact" },
    { id: "5", name: "Other", company: "Globex", warmth_stage: "connected" as const },
    { id: "6", name: "Blank", company: "", warmth_stage: "connected" as const },
    { id: "7", name: "Ali", company: "Acme", warmth_stage: "identified" as const },
    { id: "8", name: "Old", company: "acme" }, // row read before the REQ-003 migration
  ];

  it("orders exact before possible, warmest first, then by name, do-not-contact last", () => {
    const m = contactsAtCompany("Acme", contacts);
    expect(m.map((x) => x.contact.name)).toEqual(["Amna", "Ali", "Old", "Zed", "Bob", "Dnc"]);
    expect(m.map((x) => x.kind)).toEqual(["exact", "exact", "exact", "exact", "possible", "exact"]);
    expect(m[5].doNotContact).toBe(true);
  });

  it("counts only exact, contactable people (DEC-004)", () => {
    expect(countContactable(contactsAtCompany("Acme", contacts))).toBe(4);
    expect(countContactable(contactsAtCompany("Acme Robotics", contacts))).toBe(1);
    expect(countContactable(contactsAtCompany("Initech", contacts))).toBe(0);
    expect(contactsAtCompany("", contacts)).toEqual([]);
  });
});

describe("REQ-007 referralCandidates", () => {
  const contacts = [
    { id: "1", name: "Connected", company: "Acme", warmth_stage: "connected" as const },
    { id: "2", name: "Talking", company: "Acme Inc", warmth_stage: "in_conversation" as const },
    { id: "3", name: "Advocate", company: "ACME", warmth_stage: "advocate" as const },
    { id: "4", name: "Blocked", company: "Acme", warmth_stage: "advocate" as const, relationship_stage: "do_not_contact" },
    { id: "5", name: "Possible", company: "Acme Robotics", warmth_stage: "advocate" as const },
    { id: "6", name: "Elsewhere", company: "Globex", warmth_stage: "advocate" as const },
    { id: "7", name: "Old row", company: "Acme" },
  ];

  it("returns exact, contactable matches at In conversation or Advocate, advocates first", () => {
    expect(referralCandidates("Acme", contacts).map((c) => c.name)).toEqual(["Advocate", "Talking"]);
  });

  it("returns nobody for lower stages, possible matches, other companies or no company", () => {
    expect(referralCandidates("Acme Robotics", contacts).map((c) => c.name)).toEqual(["Possible"]);
    expect(referralCandidates("Initech", contacts)).toEqual([]);
    expect(referralCandidates("", contacts)).toEqual([]);
    expect(referralCandidates("Acme", contacts.filter((c) => c.id === "1" || c.id === "7"))).toEqual([]);
  });
});
