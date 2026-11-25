import { assertEquals } from "jsr:@std/assert@1";
import { confirmed, isAbsentTable, USER_TABLES } from "./tables.ts";

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
