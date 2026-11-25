import { describe, expect, it } from "vitest";
import { EMPTY_CAMPAIGN, type Campaign } from "./campaign";
import { assessFit, extractConstraints, fitCaps, freshHighFit, isFresh } from "./job-fit";

const me: Campaign = { ...EMPTY_CAMPAIGN, roleTitles: ["Backend Engineer"], citizenships: ["Pakistan"], languages: ["English", "Urdu"], needsSponsorship: true, yearsExperience: 6 };
const caps = (text: string, campaign: Campaign = me) => fitCaps(extractConstraints(text), campaign).map((c) => c.kind);

describe("extractConstraints", () => {
  it("finds a citizens-only rule and the country", () => {
    const c = extractConstraints("Great team. Applicants must be US citizens due to contract terms.");
    expect(c.citizenship?.countries).toEqual(["United States"]);
    expect(c.citizenship?.evidence).toContain("must be US citizens");
    expect(extractConstraints("This role is open to Saudi nationals only.").citizenship?.countries).toEqual(["Saudi Arabia"]);
    expect(extractConstraints("Only nationals may apply.").citizenship?.countries).toEqual([]);
  });

  it("ignores equal-opportunity wording that mentions citizenship", () => {
    expect(extractConstraints("We hire regardless of race, religion or citizenship status as required by law.").citizenship).toBeNull();
  });

  it("finds no-sponsorship and work-authorisation rules", () => {
    expect(extractConstraints("We are unable to offer visa sponsorship for this position.").noSponsorship).not.toBeNull();
    expect(extractConstraints("You must already have the right to work in the UK.").noSponsorship).not.toBeNull();
    expect(extractConstraints("Visa sponsorship is available for the right candidate.").noSponsorship).toBeNull();
  });

  it("finds required languages and skips nice-to-haves", () => {
    expect(extractConstraints("Fluent German is required. French is a plus.").languages.map((l) => l.language)).toEqual(["German"]);
    expect(extractConstraints("German language skills are nice to have.").languages).toEqual([]);
    expect(extractConstraints("Our German office is growing.").languages).toEqual([]);
  });

  it("takes the highest stated years of experience", () => {
    expect(extractConstraints("3+ years of experience with Python. At least 10 years experience in software.").minYears?.years).toBe(10);
    expect(extractConstraints("Founded 12 years ago.").minYears).toBeNull();
  });

  it("returns nothing for empty text and strips HTML", () => {
    expect(extractConstraints(null)).toEqual({ citizenship: null, noSponsorship: null, languages: [], minYears: null });
    expect(extractConstraints("<p>Fluent&nbsp;German <b>required</b>.</p>").languages).toHaveLength(1);
  });
});

describe("fitCaps", () => {
  it("caps on citizenship the user does not hold, and not on one they hold", () => {
    expect(caps("Must be US citizens.")).toEqual(["citizenship"]);
    expect(caps("Must be US citizens.", { ...me, citizenships: ["american"] })).toEqual([]);
  });

  it("caps an unnamed citizens-only rule only for a user who needs sponsorship", () => {
    expect(caps("Only nationals may apply.")).toEqual(["citizenship"]);
    expect(caps("Only nationals may apply.", { ...me, needsSponsorship: false })).toEqual([]);
  });

  it("caps on sponsorship only when the user needs it", () => {
    expect(caps("We do not sponsor visas.")).toEqual(["sponsorship"]);
    expect(caps("We do not sponsor visas.", { ...me, needsSponsorship: false })).toEqual([]);
  });

  it("caps on a required language the user lacks, and never when no languages are set", () => {
    expect(caps("Fluent German is required.")).toEqual(["language"]);
    expect(caps("Fluent English is required.")).toEqual([]);
    expect(caps("Fluent German is required.", { ...me, languages: [] })).toEqual([]);
  });

  it("caps on experience only beyond two years short, and never when years are not set", () => {
    expect(caps("At least 10 years of experience.")).toEqual(["experience"]);
    expect(caps("At least 8 years of experience.")).toEqual([]);
    expect(caps("At least 10 years of experience.", { ...me, yearsExperience: null })).toEqual([]);
  });

  it("gives each cap a label, a reason and the posting's words", () => {
    const [cap] = fitCaps(extractConstraints("Fluent German is required."), me);
    expect(cap).toMatchObject({ label: "Requires German", evidence: "Fluent German is required." });
    expect(cap.reason).toContain("not in your campaign");
  });
});

describe("assessFit", () => {
  it("is high fit only with a wanted title and no cap", () => {
    expect(assessFit({ title: "Senior Backend Engineer", description: "Python and Postgres." }, me).highFit).toBe(true);
    expect(assessFit({ title: "Senior Backend Engineer", description: "Must be US citizens." }, me).highFit).toBe(false);
    expect(assessFit({ title: "Frontend Engineer", description: "" }, me).highFit).toBe(false);
  });
});

describe("freshness", () => {
  const now = new Date("2026-11-26T12:00:00Z");

  it("is fresh up to 48 hours, using first seen when there is no posting date", () => {
    expect(isFresh({ postedAt: "2026-11-24T12:00:00Z" }, now)).toBe(true);
    expect(isFresh({ postedAt: "2026-11-24T11:59:00Z" }, now)).toBe(false);
    expect(isFresh({ postedAt: null, firstSeenAt: "2026-11-26T08:00:00Z" }, now)).toBe(true);
    expect(isFresh({}, now)).toBe(false);
    expect(isFresh({ postedAt: "2026-11-27T12:00:00Z" }, now)).toBe(false);
  });

  it("freshHighFit keeps fresh, wanted, uncapped, untracked jobs, newest first", () => {
    const found = [
      { id: "old", title: "Backend Engineer", company: "A", postedAt: "2026-11-20T00:00:00Z" },
      { id: "capped", title: "Backend Engineer", company: "B", description: "We do not sponsor visas.", postedAt: "2026-11-26T00:00:00Z" },
      { id: "other", title: "Designer", company: "C", postedAt: "2026-11-26T00:00:00Z" },
      { id: "tracked-url", title: "Backend Engineer", company: "D", jobUrl: "https://x.co/jobs/1/?utm=1", postedAt: "2026-11-26T00:00:00Z" },
      { id: "tracked-title", title: "Backend Engineer", company: "E", postedAt: "2026-11-26T00:00:00Z" },
      { id: "good-older", title: "Backend Engineer", company: "F", postedAt: "2026-11-25T00:00:00Z" },
      { id: "good-newer", title: "Staff Backend Engineer", company: "G", firstSeenAt: "2026-11-26T10:00:00Z" },
    ];
    const tracked = [{ position: "x", company: "D", jobUrl: "https://x.co/jobs/1" }, { position: "backend engineer", company: "e" }];
    expect(freshHighFit(found, me, tracked, now).map((j) => j.id)).toEqual(["good-newer", "good-older"]);
    expect(freshHighFit(found, EMPTY_CAMPAIGN, [], now)).toEqual([]);
  });
});
