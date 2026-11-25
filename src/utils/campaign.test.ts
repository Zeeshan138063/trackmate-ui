import { describe, expect, it } from "vitest";
import { campaignGaps, EMPTY_CAMPAIGN, fromRow, normalizeCampaign, parseList, titleMatches, toRow } from "./campaign";

describe("parseList", () => {
  it("splits on commas, semicolons and new lines, trims, drops blanks and repeats", () => {
    expect(parseList(" Backend Engineer, backend engineer ;Data  Engineer\n\n")).toEqual(["Backend Engineer", "Data Engineer"]);
    expect(parseList(null)).toEqual([]);
    expect(parseList(["a", " a ", "b"])).toEqual(["a", "b"]);
  });

  it("caps the list at 20 entries and each entry at 80 characters", () => {
    const many = Array.from({ length: 30 }, (_, i) => `role ${i}`).join(",");
    expect(parseList(many)).toHaveLength(20);
    expect(parseList("x".repeat(200))[0]).toHaveLength(80);
  });
});

describe("normalizeCampaign", () => {
  it("fills defaults for an empty input", () => {
    expect(normalizeCampaign({})).toEqual({ ...EMPTY_CAMPAIGN, languages: [] });
  });

  it("clamps capacity, rejects bad numbers, dates and currencies", () => {
    const c = normalizeCampaign({ dailyCapacity: 500, payFloor: -5, yearsExperience: "abc", earliestStart: "soon", payCurrency: "dollars" });
    expect(c.dailyCapacity).toBe(30);
    expect(c.payFloor).toBeNull();
    expect(c.yearsExperience).toBeNull();
    expect(c.earliestStart).toBeNull();
    expect(c.payCurrency).toBe("USD");
    expect(normalizeCampaign({ dailyCapacity: 1 }).dailyCapacity).toBe(3);
  });

  it("keeps valid values", () => {
    const c = normalizeCampaign({ roleTitles: "Backend Engineer", payFloor: "60000", payCurrency: "eur", yearsExperience: 7, earliestStart: "2027-01-15T00:00:00Z", needsSponsorship: true, remoteOk: false });
    expect(c).toMatchObject({ roleTitles: ["Backend Engineer"], payFloor: 60000, payCurrency: "EUR", yearsExperience: 7, earliestStart: "2027-01-15", needsSponsorship: true, remoteOk: false });
  });
});

describe("rows", () => {
  it("round-trips through the database shape", () => {
    const c = normalizeCampaign({ roleTitles: ["Backend Engineer"], regions: ["Germany"], citizenships: ["Pakistan"], languages: ["English", "Urdu"], needsSponsorship: true, yearsExperience: 8, payFloor: 70000, payCurrency: "EUR", earliestStart: "2027-02-01", dailyCapacity: 12, remoteOk: false });
    expect(fromRow(toRow(c))).toEqual(c);
  });

  it("reads a row with nulls as defaults", () => {
    expect(fromRow({ role_titles: null, daily_capacity: null, remote_ok: null }).dailyCapacity).toBe(10);
    expect(fromRow({}).remoteOk).toBe(true);
  });
});

describe("titleMatches", () => {
  const c = { roleTitles: ["Backend Engineer", "Sr. Python Developer"] };

  it("matches when every word of a role title is in the job title, seniority aside", () => {
    expect(titleMatches(c, "Senior Backend Engineer (Payments)")).toBe(true);
    expect(titleMatches(c, "Engineer, Backend")).toBe(true);
    expect(titleMatches(c, "Python Developer II")).toBe(true);
  });

  it("does not match other roles, empty titles or an empty campaign", () => {
    expect(titleMatches(c, "Frontend Engineer")).toBe(false);
    expect(titleMatches(c, "Engineering Manager")).toBe(false);
    expect(titleMatches(c, "")).toBe(false);
    expect(titleMatches({ roleTitles: [] }, "Backend Engineer")).toBe(false);
    expect(titleMatches({ roleTitles: ["Senior"] }, "Senior Accountant")).toBe(false);
  });
});

describe("campaignGaps", () => {
  it("lists what is missing", () => {
    expect(campaignGaps({ ...EMPTY_CAMPAIGN, remoteOk: false, languages: [] })).toHaveLength(3);
    expect(campaignGaps({ ...EMPTY_CAMPAIGN, roleTitles: ["Backend Engineer"] })).toEqual([]);
  });
});
