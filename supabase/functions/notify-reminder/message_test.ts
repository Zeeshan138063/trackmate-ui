import { assertEquals } from "jsr:@std/assert@1";
import { buildReminder, isReminderKind, isUuid } from "./message.ts";

const job = { id: "4c1f0f0e-7f6e-4c0a-9a53-0d3b0e6a1b11", position: "Engineer", company: "Acme", location: null, job_url: null };

Deno.test("only the two reminder kinds are accepted", () => {
  assertEquals(isReminderKind("deadline"), true);
  assertEquals(isReminderKind("follow_up"), true);
  assertEquals(isReminderKind("anything"), false);
  assertEquals(isReminderKind(undefined), false);
});

Deno.test("job ids must be uuids", () => {
  assertEquals(isUuid(job.id), true);
  assertEquals(isUuid("1 or 1=1"), false);
  assertEquals(isUuid(42), false);
});

Deno.test("reminder text comes from the job row and missing fields become empty strings", () => {
  const d = buildReminder("deadline", job);
  assertEquals(d.title, "Application deadline: Engineer");
  assertEquals(d.location, "");
  assertEquals(d.jobUrl, "");
  const f = buildReminder("follow_up", { ...job, location: "Riyadh", job_url: "https://example.com/j" });
  assertEquals(f.body, "You planned to follow up with Acme today.");
  assertEquals(f.location, "Riyadh");
});
