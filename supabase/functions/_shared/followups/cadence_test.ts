import { assert, assertEquals } from "jsr:@std/assert@1";
import { type CadenceInput, type ExistingFollowUp, nextFollowUp, type Touchpoint } from "./cadence.ts";
import { localParts, zonedTimeToUtc } from "./calendar.ts";
import { STATES } from "./state.ts";

const TZ = "Europe/Berlin";
const at = (m: number, d: number, h = 10) => zonedTimeToUtc(2026, m, d, h, 0, TZ);
const DAY = 86_400_000;

type Overrides = Partial<Omit<CadenceInput, "job" | "contact">> & {
  job?: Partial<CadenceInput["job"]>;
  contact?: Partial<CadenceInput["contact"]>;
};

function input(over: Overrides = {}): CadenceInput {
  return {
    now: over.now ?? at(10, 24),
    job: {
      status: "Applied",
      dateApplied: at(10, 20),
      appliedVia: "email",
      doNotFollowup: false,
      followupsPaused: false,
      responsePromisedBy: null,
      ...over.job,
    },
    contact: {
      relationshipStage: "active",
      timeZone: TZ,
      country: "DE",
      hasEmail: true,
      hasLinkedIn: true,
      ...over.contact,
    },
    touchpoints: over.touchpoints ?? [],
    followUps: over.followUps ?? [],
  };
}

const out = (date: Date, kind: Touchpoint["kind"] = "application"): Touchpoint =>
  ({ at: date, direction: "outbound", kind, channel: "email" });
const inbound = (date: Date): Touchpoint => ({ at: date, direction: "inbound", kind: "reply", channel: "email" });
const fu = (kind: ExistingFollowUp["kind"], attemptNo: number, state: ExistingFollowUp["state"], dueAt: Date, sentAt?: Date): ExistingFollowUp =>
  ({ kind, attemptNo, state, dueAt, sentAt });

Deno.test("first chaser: 6 business days after applying", () => {
  const d = nextFollowUp(input({ touchpoints: [out(at(10, 20))] }));
  assertEquals(d.type, "plan");
  if (d.type !== "plan") return;
  assertEquals([d.kind, d.attemptNo, d.channel], ["chaser", 1, "email"]);
  const p = localParts(d.dueAt, TZ);
  assertEquals([p.month, p.day], [10, 28]); // Tue 20 -> Wed 28
});

Deno.test("applied via LinkedIn follows up on LinkedIn", () => {
  const d = nextFollowUp(input({ job: { appliedVia: "linkedin" } }));
  assert(d.type === "plan" && d.channel === "linkedin");
});

Deno.test("no email and no LinkedIn means nothing to plan", () => {
  const d = nextFollowUp(input({ contact: { hasEmail: false, hasLinkedIn: false } }));
  assertEquals(d, { type: "none", reason: "no_channel_for_contact" });
});

Deno.test("second chaser: 8 business days after the first was sent", () => {
  const sent = at(10, 28);
  const d = nextFollowUp(input({
    now: at(10, 29),
    touchpoints: [out(at(10, 20)), out(sent, "followup")],
    followUps: [fu("chaser", 1, "sent", sent, sent)],
  }));
  assert(d.type === "plan");
  if (d.type !== "plan") return;
  assertEquals([d.kind, d.attemptNo], ["chaser", 2]);
  const p = localParts(d.dueAt, TZ);
  assertEquals([p.month, p.day], [11, 9]);
});

Deno.test("a skipped chaser still counts as an attempt", () => {
  const d = nextFollowUp(input({
    now: at(11, 1),
    followUps: [fu("chaser", 1, "skipped", at(10, 28)), fu("chaser", 2, "skipped", at(11, 9))],
  }));
  assertEquals(d.type, "none");
});

Deno.test("never more than two chasers; long silence moves to nurture", () => {
  const second = at(11, 9);
  const base = {
    touchpoints: [out(at(10, 20)), out(at(10, 28), "followup"), out(second, "followup")],
    followUps: [fu("chaser", 1, "sent", at(10, 28), at(10, 28)), fu("chaser", 2, "sent", second, second)],
  };
  assertEquals(nextFollowUp(input({ ...base, now: at(11, 12) })), { type: "none", reason: "max_chasers_reached" });
  const later = nextFollowUp(input({ ...base, now: at(12, 4) }));
  assertEquals(later.type, "move_to_nurture");
  if (later.type === "move_to_nurture") {
    const days = (later.nextTouchAt.getTime() - at(12, 4).getTime()) / DAY;
    assert(days >= 60 && days <= 90, `nurture in ${days} days`);
  }
});

Deno.test("a reply stops chasing", () => {
  const d = nextFollowUp(input({ touchpoints: [out(at(10, 20)), inbound(at(10, 22))] }));
  assertEquals(d, { type: "none", reason: "they_replied" });
});

Deno.test("never plans beside an open follow-up", () => {
  for (const state of ["planned", "drafting", "awaiting_approval", "approved", "sending", "awaiting_manual_send", "failed"] as const) {
    const d = nextFollowUp(input({ followUps: [fu("chaser", 1, state, at(10, 28))] }));
    assertEquals(d, { type: "none", reason: "open_followup_exists" }, state);
  }
});

Deno.test("hard stops win", () => {
  assertEquals(nextFollowUp(input({ job: { doNotFollowup: true } })).type, "none");
  assertEquals(nextFollowUp(input({ job: { followupsPaused: true } })).type, "none");
  assertEquals(nextFollowUp(input({ contact: { relationshipStage: "do_not_contact" } })).type, "none");
});

Deno.test("old applications are not chased (role likely filled)", () => {
  const d = nextFollowUp(input({ job: { dateApplied: at(9, 1) } }));
  assertEquals(d, { type: "none", reason: "application_too_old_to_chase" });
});

Deno.test("bookmarked jobs are not chased", () => {
  assertEquals(nextFollowUp(input({ job: { status: "Bookmarked", dateApplied: null } })).type, "none");
});

Deno.test("rejected moves the contact to nurture once", () => {
  assertEquals(nextFollowUp(input({ job: { status: "Rejected" } })).type, "move_to_nurture");
  assertEquals(nextFollowUp(input({ job: { status: "Rejected" }, contact: { relationshipStage: "nurture" } })).type, "none");
});

Deno.test("thank-you the same day as an interview, only once", () => {
  const interview: Touchpoint = { at: at(10, 26, 15), direction: "inbound", kind: "interview", channel: "meeting" };
  const now = at(10, 26, 17);
  const d = nextFollowUp(input({ now, job: { status: "Interviewing" }, touchpoints: [out(at(10, 20)), interview] }));
  assert(d.type === "plan" && d.kind === "thank_you" && d.dueAt.getTime() === now.getTime());
  const again = nextFollowUp(input({
    now: at(10, 27),
    job: { status: "Interviewing" },
    touchpoints: [out(at(10, 20)), interview],
    followUps: [fu("thank_you", 1, "skipped", now)],
  }));
  assert(!(again.type === "plan" && again.kind === "thank_you"));
});

Deno.test("promised date: check in 2 business days after, and only once per date", () => {
  const promised = at(10, 30);
  const d = nextFollowUp(input({ job: { responsePromisedBy: promised } }));
  assert(d.type === "plan" && d.kind === "deadline_checkin");
  if (d.type !== "plan") return;
  const p = localParts(d.dueAt, TZ);
  assertEquals([p.month, p.day], [11, 3]);
  const sent = nextFollowUp(input({
    now: at(11, 4),
    job: { responsePromisedBy: promised, dateApplied: at(10, 28) },
    followUps: [fu("deadline_checkin", 1, "sent", d.dueAt, d.dueAt)],
  }));
  assert(!(sent.type === "plan" && sent.kind === "deadline_checkin"));
});

// Property test: whatever happens, at most 2 chasers and never a chaser right after a reply.
Deno.test("property: random histories never exceed 2 chasers or chase a reply", () => {
  let seed = 42;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
  const terminal = ["sent", "skipped", "cancelled"] as const;

  for (let run = 0; run < 2000; run++) {
    const applied = at(10, 1 + Math.floor(rand() * 20));
    const touchpoints: Touchpoint[] = [out(applied)];
    const followUps: ExistingFollowUp[] = [];
    let now = new Date(applied.getTime() + DAY);

    for (let step = 0; step < 12; step++) {
      now = new Date(now.getTime() + Math.floor(rand() * 6) * DAY);
      if (rand() < 0.15) touchpoints.push(inbound(new Date(now.getTime() - 3_600_000)));
      const d = nextFollowUp(input({ now, job: { dateApplied: applied }, touchpoints, followUps }));
      if (d.type !== "plan") continue;

      const chasers = followUps.filter((f) => f.kind === "chaser").length;
      if (d.kind === "chaser") {
        assert(chasers < 2, `third chaser planned in run ${run}`);
        const last = [...touchpoints].sort((a, b) => a.at.getTime() - b.at.getTime()).at(-1)!;
        assert(last.direction === "outbound", `chased after a reply in run ${run}`);
      }
      const state = terminal[Math.floor(rand() * terminal.length)];
      followUps.push(fu(d.kind, d.attemptNo, state, d.dueAt, state === "sent" ? d.dueAt : undefined));
      if (state === "sent") touchpoints.push(out(d.dueAt, "followup"));
    }
  }
  assert(STATES.length === 10);
});
