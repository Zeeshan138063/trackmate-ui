import { describe, expect, it } from "vitest";
import type { Contact } from "@/types/contact";
import { parseConnectionsCsv, parseCsv, planImport, rowMatches, toContact } from "./linkedin-csv";

const FILE = `Notes:
"When exporting your connection data, you may notice that some of the email addresses are missing. You will only see email addresses for connections who allowed it."

First Name,Last Name,URL,Email Address,Company,Position,Connected On
Amna,Khan,https://www.linkedin.com/in/amna-khan,amna@acme.io,"Acme, Inc.",Engineering Manager,12 Mar 2024
Bilal,Ahmed,https://www.linkedin.com/in/bilal,,Globex,"VP ""Platform""",01 Jan 2023
,,,,,,
,,https://www.linkedin.com/in/ghost,,Nowhere,,
`;

describe("parseCsv", () => {
  it("handles quotes, doubled quotes, commas and line breaks inside quotes, CRLF and a BOM", () => {
    expect(parseCsv('\uFEFFa,"b,c","d ""e"""\r\n"line1\nline2",x\n')).toEqual([["a", "b,c", 'd "e"'], ["line1\nline2", "x"]]);
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("a,b")).toEqual([["a", "b"]]);
  });
});

describe("parseConnectionsCsv", () => {
  it("skips LinkedIn's notes, reads each connection and counts rows with no name", () => {
    const r = parseConnectionsCsv(FILE);
    expect(r.error).toBeNull();
    expect(r.skipped).toBe(1);
    expect(r.rows.map((x) => x.name)).toEqual(["Amna Khan", "Bilal Ahmed"]);
    expect(r.rows[0]).toMatchObject({ company: "Acme, Inc.", position: "Engineering Manager", email: "amna@acme.io", linkedin_url: "https://www.linkedin.com/in/amna-khan", connectedOn: "12 Mar 2024" });
    expect(r.rows[1]).toMatchObject({ position: 'VP "Platform"', email: "" });
  });

  it("rejects a file that is not the connections export, and an export with no rows", () => {
    expect(parseConnectionsCsv("name,email\nx,y").error).toMatch(/does not look like/);
    expect(parseConnectionsCsv("First Name,Last Name,URL\n").error).toBe("No connections were found in this file.");
  });

  it("drops unsafe links, bad emails and leading formula characters", () => {
    const r = parseConnectionsCsv('First Name,Last Name,URL,Email Address,Company,Position,Connected On\n=cmd,Smith,javascript:alert(1),not-an-email,+Evil Co,@role,x');
    expect(r.rows[0]).toMatchObject({ name: "cmd Smith", linkedin_url: "", email: "", company: "Evil Co", position: "role" });
  });

  it("works when columns are in another order or missing", () => {
    const r = parseConnectionsCsv("Last Name,First Name\nKhan,Amna");
    expect(r.rows[0]).toMatchObject({ name: "Amna Khan", company: "", linkedin_url: "" });
  });

  it("stops at 5,000 rows and says so", () => {
    const many = "First Name,Last Name\n" + Array.from({ length: 5003 }, (_, i) => `P${i},X`).join("\n");
    const r = parseConnectionsCsv(many);
    expect(r.rows).toHaveLength(5000);
    expect(r.truncated).toBe(true);
  });
});

describe("planImport", () => {
  const existing: Contact[] = [{ id: "1", user_id: "u", name: "Amna K.", linkedin_url: "https://linkedin.com/in/amna-khan/" }];

  it("separates new people from ones already in contacts or repeated in the file", () => {
    const rows = parseConnectionsCsv(FILE + "Bilal,Ahmed,https://www.linkedin.com/in/bilal,,Globex,VP,02 Jan 2023\n").rows;
    const plan = planImport(rows, existing);
    expect(plan.fresh.map((r) => r.name)).toEqual(["Bilal Ahmed"]);
    expect(plan.duplicates.map((d) => `${d.row.name}:${d.why}`)).toEqual(["Amna Khan:LinkedIn profile", "Bilal Ahmed:LinkedIn profile"]);
    expect(plan.duplicates[0].existingName).toBe("Amna K.");
  });
});

describe("toContact and rowMatches", () => {
  const row = parseConnectionsCsv(FILE).rows[0];

  it("starts an imported connection at Connected with no notes", () => {
    expect(toContact(row)).toEqual({ name: "Amna Khan", company: "Acme, Inc.", position: "Engineering Manager", email: "amna@acme.io", linkedin_url: "https://www.linkedin.com/in/amna-khan", warmth_stage: "connected" });
  });

  it("searches name, company and position", () => {
    expect(rowMatches(row, "acme")).toBe(true);
    expect(rowMatches(row, " MANAGER ")).toBe(true);
    expect(rowMatches(row, "globex")).toBe(false);
    expect(rowMatches(row, "")).toBe(true);
  });
});
