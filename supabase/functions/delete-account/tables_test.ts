import { assertEquals } from "jsr:@std/assert@1";
import { confirmed, isAbsentTable, ownResumePaths, USER_TABLES } from "./tables.ts";

Deno.test("deletion needs the exact confirmation word", () => {
  assertEquals(confirmed({ confirm: "DELETE" }), true);
  assertEquals(confirmed({ confirm: "delete" }), false);
  assertEquals(confirmed({}), false);
  assertEquals(confirmed(null), false);
  assertEquals(confirmed("DELETE"), false);
});

Deno.test("only missing-table errors are skipped", () => {
  assertEquals(isAbsentTable({ code: "42P01" }), true);
  assertEquals(isAbsentTable({ code: "PGRST205" }), true);
  assertEquals(isAbsentTable({ code: "23503" }), false); // foreign key violation must stop the run
  assertEquals(isAbsentTable(null), false);
});

Deno.test("children are deleted before the rows they point at, and no table is listed twice", () => {
  const at = (t: string) => USER_TABLES.indexOf(t as (typeof USER_TABLES)[number]);
  assertEquals(new Set(USER_TABLES).size, USER_TABLES.length);
  assertEquals(at("follow_up_events") < at("follow_ups"), true);
  assertEquals(at("follow_ups") < at("jobs"), true);
  assertEquals(at("engagements") < at("contacts"), true);
  assertEquals(at("dream_company_reminders") < at("dream_companies"), true);
  assertEquals(at("contacts") < at("dream_companies"), true);
  assertEquals(at("profiles"), USER_TABLES.length - 1);
});

Deno.test("only resume files inside the caller's own folder are removed", () => {
  const me = "4c1f0f0e-7f6e-4c0a-9a53-0d3b0e6a1b11";
  assertEquals(
    ownResumePaths(me, [`${me}/job1/a.pdf`, "someone-else/job/b.pdf", `${me}/../someone-else/c.pdf`, null, undefined, `x${me}/d.pdf`]),
    [`${me}/job1/a.pdf`],
  );
});

Deno.test("resume rows are deleted before the jobs they belong to", () => {
  const at = (t: string) => USER_TABLES.indexOf(t as (typeof USER_TABLES)[number]);
  assertEquals(at("application_resumes") >= 0 && at("application_resumes") < at("jobs"), true);
});
