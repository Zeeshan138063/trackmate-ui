import { describe, expect, it } from "vitest";
import {
  addDays,
  type ContactForAction,
  dayOf,
  daysBetween,
  dueToday,
  type InteractionForAction,
  nextAction,
  type ReminderForAction,
  RULES,
  suggestedStage,
} from "./contact-next-action";

const TODAY = "2026-11-26";
const at = (day: string, time = "09:00:00") => `${day}T${time}.000Z`;

const contact = (over: Partial<ContactForAction> = {}): ContactForAction => ({
  warmthStage: "identified",
  warmthStageChangedAt: at("2026-11-20"),
  doNotContact: false,
  snoozedUntil: null,
  nurtureNextTouchAt: null,
  ...over,
});
const out = (day: string, type: InteractionForAction["type"] = "linkedin"): InteractionForAction => ({ type, direction: "outbound", date: at(day) });
const inb = (day: string, type: InteractionForAction["type"] = "linkedin"): InteractionForAction => ({ type, direction: "inbound", date: at(day) });
const reminder = (day: string, over: Partial<ReminderForAction> = {}): ReminderForAction => ({ id: "r1", dueDate: at(day), status: "pending", ...over });

describe("dates", () => {
  it("reduces timestamps to a day and does day arithmetic", () => {
    expect(dayOf("2026-11-26T23:59:59.000Z")).toBe("2026-11-26");
    expect(dayOf("2026-11-26")).toBe("2026-11-26");
    expect(addDays("2026-11-28", 5)).toBe("2026-12-03");
    expect(daysBetween("2026-11-20", "2026-11-26")).toBe(6);
  });
});

describe("AC-4 precedence", () => {
  it("1: do-not-contact beats everything, including a reply and a reminder", () => {
    const a = nextAction(contact({ doNotContact: true }), [inb("2026-11-25")], [reminder("2026-11-20")], TODAY);
    expect(a).toEqual({ kind: "none", reason: "Marked do not contact" });
  });

  it("2: a future snooze hides the action; a snooze that has ended does not", () => {
    expect(nextAction(contact({ snoozedUntil: "2026-11-28" }), [], [reminder("2026-11-20")], TODAY).kind).toBe("none");
    expect(nextAction(contact({ snoozedUntil: TODAY }), [], [], TODAY).kind).toBe("follow");
  });

  it("3: the earliest pending reminder comes before stage rules and replies", () => {
    const a = nextAction(
      contact({ warmthStage: "connected" }),
      [inb("2026-11-25")],
      [reminder("2026-12-01", { id: "late" }), reminder("2026-11-27", { id: "early", notes: "Send portfolio" }), reminder("2026-11-01", { id: "done", status: "completed" })],
      TODAY,
    );
    expect(a).toMatchObject({ kind: "reminder", reminderId: "early", label: "Send portfolio", dueDate: "2026-11-27" });
  });

  it("4: reply when they wrote last, due the day they wrote", () => {
    const a = nextAction(contact({ warmthStage: "in_conversation" }), [out("2026-11-22"), inb("2026-11-24")], [], TODAY);
    expect(a).toMatchObject({ kind: "reply", dueDate: "2026-11-24" });
  });

  it("4: no reply prompt once the user has answered", () => {
    const a = nextAction(contact({ warmthStage: "in_conversation" }), [inb("2026-11-24"), out("2026-11-25")], [], TODAY);
    expect(a.kind).toBe("check_in");
  });

  it("5: thank-you within two days of a call, until a message is sent after it", () => {
    const c = contact({ warmthStage: "in_conversation" });
    expect(nextAction(c, [out("2026-11-25", "call")], [], TODAY)).toMatchObject({ kind: "thank_you", dueDate: "2026-11-25" });
    expect(nextAction(c, [out("2026-11-25", "meeting"), { type: "email", direction: "outbound", date: at("2026-11-25", "15:00:00") }], [], TODAY).kind).toBe("check_in");
    expect(nextAction(c, [out("2026-11-20", "call")], [], TODAY).kind).toBe("check_in"); // too old
  });
});

describe("AC-4 stage rules", () => {
  it("identified: follow, due from the stage date", () => {
    expect(nextAction(contact(), [], [], TODAY)).toMatchObject({ kind: "follow", dueDate: "2026-11-20" });
  });

  it("following: engage two days after the last interaction, and count progress", () => {
    const c = contact({ warmthStage: "following" });
    expect(nextAction(c, [], [], TODAY)).toMatchObject({ kind: "engage", dueDate: "2026-11-22", reason: "0 of 2 interactions logged" });
    expect(nextAction(c, [out("2026-11-25")], [], TODAY)).toMatchObject({ kind: "engage", dueDate: "2026-11-27", reason: "1 of 2 interactions logged" });
  });

  it("following: interactions before the stage change do not count", () => {
    const c = contact({ warmthStage: "following" });
    expect(nextAction(c, [out("2026-11-10"), out("2026-11-11")], [], TODAY)).toMatchObject({ reason: "0 of 2 interactions logged" });
  });

  it("engaged: connect one day after the stage change", () => {
    expect(nextAction(contact({ warmthStage: "engaged" }), [], [], TODAY)).toMatchObject({ kind: "connect", dueDate: "2026-11-21" });
  });

  it("connected: ask for advice, then at most two follow-ups six days apart, then rest 30 days", () => {
    const c = contact({ warmthStage: "connected", warmthStageChangedAt: at("2026-10-01") });
    expect(nextAction(c, [], [], TODAY)).toMatchObject({ kind: "ask_advice", dueDate: "2026-10-03" });
    expect(nextAction(c, [out("2026-10-03")], [], TODAY)).toMatchObject({ kind: "follow_up", label: "Follow up (1 of 2)", dueDate: "2026-10-09" });
    expect(nextAction(c, [out("2026-10-03"), out("2026-10-09")], [], TODAY)).toMatchObject({ kind: "follow_up", label: "Follow up (2 of 2)", dueDate: "2026-10-15" });

    const three = [out("2026-10-03"), out("2026-10-09"), out("2026-10-15")];
    expect(nextAction(c, three, [], "2026-11-01")).toEqual({ kind: "none", reason: "Resting until 2026-11-14 after 2 follow-ups without a reply" });
    expect(nextAction(c, three, [], "2026-11-14")).toMatchObject({ kind: "check_in", dueDate: "2026-11-14" });
    expect(RULES.maxFollowUps).toBe(2);
  });

  it("connected: once they have replied and been answered, it becomes a check-in", () => {
    const c = contact({ warmthStage: "connected", warmthStageChangedAt: at("2026-11-01") });
    expect(nextAction(c, [out("2026-11-03"), inb("2026-11-05"), out("2026-11-06")], [], TODAY)).toMatchObject({ kind: "check_in", dueDate: "2026-11-20" });
  });

  it("in conversation: check in 14 days after the last contact", () => {
    const c = contact({ warmthStage: "in_conversation", warmthStageChangedAt: at("2026-11-01") });
    expect(nextAction(c, [inb("2026-11-09"), out("2026-11-10")], [], TODAY)).toMatchObject({ kind: "check_in", dueDate: "2026-11-24" });
    expect(nextAction(c, [], [], TODAY)).toMatchObject({ kind: "check_in", dueDate: "2026-11-15" });
  });

  it("advocate: keep in touch 30 days after the last contact", () => {
    const c = contact({ warmthStage: "advocate", warmthStageChangedAt: at("2026-10-01") });
    expect(nextAction(c, [out("2026-10-20")], [], TODAY)).toMatchObject({ kind: "keep_in_touch", dueDate: "2026-11-19" });
  });
});

describe("AC-5 follow-up agent nurture date", () => {
  it("replaces the stage rule but not a reply", () => {
    const c = contact({ warmthStage: "connected", nurtureNextTouchAt: at("2027-01-15") });
    expect(nextAction(c, [], [], TODAY)).toMatchObject({ kind: "keep_in_touch", dueDate: "2027-01-15" });
    expect(nextAction(c, [inb("2026-11-25")], [], TODAY).kind).toBe("reply");
  });
});

describe("AC-6 suggested stage", () => {
  it("following with two outbound interactions since the change suggests engaged", () => {
    const c = contact({ warmthStage: "following" });
    expect(suggestedStage(c, [out("2026-11-21")])).toBeNull();
    expect(suggestedStage(c, [out("2026-11-21"), out("2026-11-23")])).toBe("engaged");
    expect(suggestedStage(c, [out("2026-11-01"), out("2026-11-02")])).toBeNull();
  });

  it("connected with an inbound interaction suggests in conversation", () => {
    const c = contact({ warmthStage: "connected" });
    expect(suggestedStage(c, [out("2026-11-21")])).toBeNull();
    expect(suggestedStage(c, [out("2026-11-21"), inb("2026-11-22")])).toBe("in_conversation");
  });

  it("never suggests for do-not-contact or other stages", () => {
    expect(suggestedStage(contact({ warmthStage: "following", doNotContact: true }), [out("2026-11-21"), out("2026-11-23")])).toBeNull();
    expect(suggestedStage(contact({ warmthStage: "identified" }), [out("2026-11-21"), inb("2026-11-23")])).toBeNull();
  });
});

describe("AC-7 today's list", () => {
  it("keeps only due actions, most overdue first, then by name", () => {
    const items = [
      { name: "Zara", action: nextAction(contact(), [], [], TODAY) }, // due 11-20
      { name: "Adam", action: nextAction(contact(), [], [], TODAY) }, // due 11-20
      { name: "Bilal", action: nextAction(contact({ warmthStageChangedAt: at("2026-11-10") }), [], [], TODAY) }, // due 11-10
      { name: "Later", action: nextAction(contact({ warmthStage: "following", warmthStageChangedAt: at("2026-11-25") }), [], [], TODAY) }, // due 11-27
      { name: "Blocked", action: nextAction(contact({ doNotContact: true }), [], [], TODAY) },
      { name: "Today", action: nextAction(contact({ warmthStageChangedAt: at(TODAY) }), [], [], TODAY) },
    ];
    expect(dueToday(items, TODAY).map((i) => i.name)).toEqual(["Bilal", "Adam", "Zara", "Today"]);
  });
});
