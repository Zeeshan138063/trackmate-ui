import { describe, expect, it } from "vitest";
import { initialMasterProfile, type MasterProfile } from "@/types/resume";
import { buildReport, compareLinkedInText, compareResume, findRange, formatYearMonth, parseYearMonth, sameYearMonth } from "./consistency";

const master: MasterProfile = {
  ...initialMasterProfile,
  contact: { firstName: "Zee", lastName: "Shan", email: "z@example.com", phone: "+92 300 1234567", location: "Lahore, Pakistan" },
  experience: [
    { id: "1", company: "Kad Agency", position: "Senior Engineer", location: "Lahore", startDate: "2021-03", endDate: "", current: true, description: "" },
    { id: "2", company: "Acme Inc.", position: "Software Engineer", location: "Lahore", startDate: "2018-06", endDate: "2021-02", current: false, description: "" },
  ],
  education: [{ id: "e", school: "LUMS", degree: "BS", field: "Computer Science", location: "Lahore", startDate: "2014", endDate: "2018" }],
};
const copy = (over: Partial<MasterProfile> = {}): MasterProfile => ({ ...JSON.parse(JSON.stringify(master)), ...over });

describe("dates", () => {
  it("reads the formats the app and LinkedIn use", () => {
    expect(parseYearMonth("2020-01")).toEqual({ year: 2020, month: 1 });
    expect(parseYearMonth("2020-01-15")).toEqual({ year: 2020, month: 1 });
    expect(parseYearMonth("03/2019")).toEqual({ year: 2019, month: 3 });
    expect(parseYearMonth("Jan 2020")).toEqual({ year: 2020, month: 1 });
    expect(parseYearMonth("September 2020")).toEqual({ year: 2020, month: 9 });
    expect(parseYearMonth("2020")).toEqual({ year: 2020, month: null });
    expect(parseYearMonth("Present")).toBeNull();
    expect(parseYearMonth("13/2020")).toBeNull();
    expect(parseYearMonth("")).toBeNull();
  });

  it("compares by year, and by month only when both have one", () => {
    expect(sameYearMonth({ year: 2020, month: 1 }, { year: 2020, month: null })).toBe(true);
    expect(sameYearMonth({ year: 2020, month: 1 }, { year: 2020, month: 2 })).toBe(false);
    expect(sameYearMonth({ year: 2020, month: 1 }, { year: 2021, month: 1 })).toBe(false);
    expect(sameYearMonth(null, { year: 2020, month: 1 })).toBeNull();
    expect(formatYearMonth({ year: 2021, month: 3 })).toBe("Mar 2021");
  });

  it("finds a date range in a line of profile text", () => {
    expect(findRange("Mar 2021 - Present · 5 yrs 9 mos")).toMatchObject({ start: { year: 2021, month: 3 }, present: true });
    expect(findRange("June 2018 – Feb 2021")).toMatchObject({ start: { year: 2018, month: 6 }, end: { year: 2021, month: 2 }, present: false });
    expect(findRange("2014 - 2018")).toMatchObject({ start: { year: 2014, month: null }, end: { year: 2018, month: null } });
    expect(findRange("Lahore, Pakistan")).toBeNull();
  });
});

describe("compareResume", () => {
  it("finds nothing when the resume is a subset of the Master Profile", () => {
    expect(compareResume(master, copy({ experience: [master.experience[0]] }), "CV")).toEqual([]);
    expect(compareResume(master, null, "CV")).toEqual([]);
  });

  it("reports a changed title and changed dates as conflicts", () => {
    const cv = copy();
    cv.experience[0].position = "Engineering Lead";
    cv.experience[1].startDate = "2017-06";
    const f = compareResume(master, cv, "CV");
    expect(f).toHaveLength(2);
    expect(f[0]).toMatchObject({ severity: "conflict", field: "title", master: "Senior Engineer", other: "Engineering Lead", subject: "Senior Engineer at Kad Agency" });
    expect(f[1]).toMatchObject({ severity: "conflict", field: "dates", master: "Jun 2018 to Feb 2021", other: "Jun 2017 to Feb 2021" });
  });

  it("reports a role shown as current that the Master Profile ended, and the reverse", () => {
    const cv = copy();
    cv.experience[1].current = true;
    cv.experience[1].endDate = "";
    expect(compareResume(master, cv, "CV")[0]).toMatchObject({ field: "dates", other: "Jun 2018 to Present" });
  });

  it("reports an employer or school that is not in the Master Profile", () => {
    const cv = copy();
    cv.experience.push({ id: "9", company: "Globex", position: "CTO", location: "", startDate: "2010-01", endDate: "2012-01", current: false, description: "" });
    cv.education[0].school = "MIT";
    const f = compareResume(master, cv, "CV");
    expect(f.map((x) => x.field)).toEqual(["employer", "education"]);
  });

  it("treats company suffixes and phone formatting as the same", () => {
    const cv = copy();
    cv.experience[1].company = "Acme";
    cv.contact.phone = "+923001234567";
    expect(compareResume(master, cv, "CV")).toEqual([]);
  });

  it("reports a different location or name, and unreadable dates as a check", () => {
    const cv = copy();
    cv.contact.location = "Berlin, Germany";
    cv.contact.lastName = "Khan";
    cv.experience[0].startDate = "spring";
    const f = compareResume(master, cv, "CV");
    expect(f.map((x) => `${x.severity}:${x.field}`)).toEqual(["conflict:name", "conflict:location", "check:dates"]);
  });

  it("pairs two roles at one employer by title", () => {
    const m = copy();
    m.experience.push({ id: "3", company: "Kad Agency", position: "Engineer", location: "", startDate: "2020-01", endDate: "2021-02", current: false, description: "" });
    const cv = copy({ experience: [m.experience[2], m.experience[0]] });
    expect(compareResume(m, cv, "CV")).toEqual([]);
  });
});

describe("compareLinkedInText", () => {
  const profile = `Zee Shan
Lahore, Punjab, Pakistan
Experience
Senior Engineer
Kad Agency · Full-time
Mar 2021 - Present · 5 yrs 9 mos
Software Engineer
Acme Inc
Jun 2018 - Feb 2021 · 2 yrs 9 mos
Education
LUMS
BS, Computer Science
2014 - 2018`;

  it("finds nothing when the profile text agrees", () => {
    expect(compareLinkedInText(master, profile)).toEqual([]);
    expect(compareLinkedInText(master, "  ")).toEqual([]);
  });

  it("reports different dates as a conflict, showing both", () => {
    const f = compareLinkedInText(master, profile.replace("Jun 2018 - Feb 2021", "Jan 2018 - Feb 2021"));
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ severity: "conflict", field: "dates", master: "Jun 2018 to Feb 2021", other: "Jan 2018 to Feb 2021" });
  });

  it("reports a different title as a conflict", () => {
    const f = compareLinkedInText(master, profile.replace("Senior Engineer", "Head of Engineering"));
    expect(f).toEqual([expect.objectContaining({ severity: "conflict", field: "title", master: "Senior Engineer" })]);
  });

  it("reports a missing employer, school and location as things to check", () => {
    const f = compareLinkedInText(master, "Zee Shan\nBerlin\nExperience\nSenior Engineer\nKad Agency\nMar 2021 - Present");
    expect(f.map((x) => `${x.severity}:${x.field}`)).toEqual(["check:employer", "check:education", "check:location"]);
  });

  it("says when no dates sit near an employer", () => {
    const f = compareLinkedInText(master, profile.replace("Mar 2021 - Present · 5 yrs 9 mos\n", ""));
    expect(f.some((x) => x.field === "dates" && x.subject.includes("Kad"))).toBe(true);
  });
});

describe("buildReport", () => {
  it("counts findings per source and lists conflicts first", () => {
    const cv = copy();
    cv.experience[0].position = "Lead";
    const r = buildReport(master, [{ label: "CV for Acme", resume: cv }, { label: "CV for Globex", resume: copy() }, { label: "No data", resume: null }], "Zee Shan\nBerlin");
    expect(r.sources.map((s) => s.source)).toEqual(["CV for Acme", "CV for Globex", "LinkedIn"]);
    expect(r.conflicts).toBe(1);
    expect(r.findings[0].severity).toBe("conflict");
    expect(r.checks).toBe(r.findings.length - 1);
  });

  it("skips LinkedIn when no text is pasted", () => {
    expect(buildReport(master, [], "").sources).toEqual([]);
  });
});
