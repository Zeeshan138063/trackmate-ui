import { assert, assertEquals, assertThrows } from "jsr:@std/assert@1";
import {
  assertTransition,
  canTransition,
  IllegalTransitionError,
  legacyStatus,
  STATES,
  TERMINAL_STATES,
  TRANSITIONS,
} from "./state.ts";

Deno.test("terminal states have no way out", () => {
  for (const s of TERMINAL_STATES) assertEquals(TRANSITIONS[s].length, 0);
});

Deno.test("nothing reaches sent without passing approval", () => {
  // Only sending and awaiting_manual_send lead to sent, and only approval leads to those.
  const intoSent = STATES.filter((s) => canTransition(s, "sent"));
  assertEquals(intoSent.sort(), ["awaiting_manual_send", "sending"]);
  const intoSending = STATES.filter((s) => canTransition(s, "sending"));
  assertEquals(intoSending, ["approved"]);
  const intoApproved = STATES.filter((s) => canTransition(s, "approved"));
  assertEquals(intoApproved.sort(), ["awaiting_approval", "failed", "sending"]);
  const intoManual = STATES.filter((s) => canTransition(s, "awaiting_manual_send"));
  assertEquals(intoManual, ["awaiting_approval"]);
});

Deno.test("planned cannot jump straight to sending", () => {
  assertThrows(() => assertTransition("planned", "sending"), IllegalTransitionError);
});

Deno.test("legacy status mapping", () => {
  assertEquals(legacyStatus("sent"), "completed");
  assertEquals(legacyStatus("cancelled"), "completed");
  assertEquals(legacyStatus("failed"), "missed");
  assertEquals(legacyStatus("awaiting_approval"), "pending");
});

Deno.test("SQL trigger and TS transition table are identical", async () => {
  const sql = await Deno.readTextFile(
    new URL("../../../migrations/20261024120000_followup_agent.sql", import.meta.url),
  );
  const body = sql.slice(
    sql.indexOf("follow_up_transition_allowed(from_state text"),
    sql.indexOf("create or replace function public.follow_ups_guard"),
  );
  const fromSql = [...body.matchAll(/\('([a-z_]+)', '([a-z_]+)'\)/g)].map((m) => `${m[1]}>${m[2]}`).sort();
  const fromTs = STATES.flatMap((s) => TRANSITIONS[s].map((t) => `${s}>${t}`)).sort();
  assert(fromSql.length > 0, "no transitions parsed from SQL");
  assertEquals(fromSql, fromTs);
});
