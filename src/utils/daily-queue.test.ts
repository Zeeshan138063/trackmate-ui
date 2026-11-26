import { describe, expect, it } from "vitest";
import { buildDailyQueue, clampLimit, collectItems, effectiveUntil, type QueueInput } from "./daily-queue";

const TODAY = "2026-11-26";
const empty: QueueInput = { jobs: [], agentFollowUps: [], contactActions: [], events: [] };
const job = (id: string, over: Partial<QueueInput["jobs"][number]> = {}) => ({ id, position: "Engineer", company: `Co${id}`, status: "Bookmarked", ...over });
const person = (id: string, kind: string, dueDate: string, name = `P${id}`) => ({
  contactId: id,
  name,
  company: "Acme",
  action: { kind, label: kind, reason: "because", dueDate } as never,
});

describe("AC-2 sources and groups", () => {
  it("applications: Applying jobs, and Bookmarked jobs with a deadline within 3 days", () => {
    const items = collectItems({
      ...empty,
      jobs: [
        job("1", { status: "Applying" }),
        job("2", { status: "Applying", deadline: "2026-11-20" }),
        job("3", { deadline: "2026-11-29" }),
        job("4", { deadline: "2026-11-30" }), // 4 days away
        job("5", { deadline: "2026-11-25" }), // bookmarked, deadline passed: cannot apply
        job("6"), // bookmarked, no deadline
        job("7", { status: "Applied", deadline: TODAY }),
      ],
    }, TODAY);
    expect(items.map((i) => i.key)).toEqual(["job:1:apply", "job:2:apply", "job:3:deadline"]);
    expect(items[0].reason).toBe("You started this application");
    expect(items[1].reason).toBe("Deadline passed on 2026-11-20");
    expect(items[2].reason).toBe("Deadline in 3 days");
    expect(items.every((i) => i.group === "applications")).toBe(true);
  });

  it("follow-ups: agent items awaiting the user, job follow-up dates, reply-type contact actions", () => {
    const items = collectItems({
      jobs: [job("1", { status: "Applied", followUp: "2026-11-25" }), job("2", { status: "Rejected", followUp: "2026-11-25" }), job("3", { status: "Applied", followUp: "2026-11-27" })],
      agentFollowUps: [
        { id: "a", jobId: "1", state: "awaiting_approval", contactName: "Sara" },
        { id: "b", jobId: "9", state: "awaiting_manual_send", dueDate: "2026-11-24T08:00:00Z" },
        { id: "c", jobId: "1", state: "sent" },
        { id: "d", jobId: "1", state: "planned" },
      ],
      contactActions: [person("x", "reply", "2026-11-24"), person("y", "thank_you", TODAY), person("z", "reminder", "2026-11-27")],
      events: [],
    }, TODAY);
    expect(items.map((i) => i.key)).toEqual(["job:1:followup", "agent:a", "agent:b", "contact:x:reply", "contact:y:thank_you"]);
    expect(items.every((i) => i.group === "followups")).toBe(true);
    expect(items[1].title).toBe("Review the drafted follow-up to Sara: Engineer at Co1");
    expect(items[2].title).toBe("Send your LinkedIn message: an application");
    expect(items[2].dueDate).toBe("2026-11-24");
  });

  it("people: the other contact actions, only when due; 'none' never appears", () => {
    const items = collectItems({
      ...empty,
      contactActions: [
        person("1", "engage", TODAY),
        person("2", "connect", "2026-11-27"),
        { contactId: "3", name: "Dnc", action: { kind: "none", reason: "Marked do not contact" } },
      ],
    }, TODAY);
    expect(items.map((i) => [i.key, i.group])).toEqual([["contact:1:engage", "people"]]);
    expect(items[0].title).toBe("engage: P1 (Acme)");
  });
});

describe("REQ-007 referral note", () => {
  it("adds who could refer you to application items only", () => {
    const items = collectItems({
      ...empty,
      jobs: [
        job("1", { status: "Applying", referralName: "Amna" }),
        job("2", { deadline: "2026-11-27", referralName: "Bilal" }),
        job("3", { status: "Applied", followUp: TODAY, referralName: "Chen" }),
        job("4", { status: "Applying" }),
      ],
    }, TODAY);
    expect(items.map((i) => i.reason)).toEqual([
      "You started this application · Amna at Co1 could refer you",
      "Deadline in 1 day · Bilal at Co2 could refer you",
      "You set a follow-up for 2026-11-26",
      "You started this application",
    ]);
  });
});

describe("AC-3 order and limit", () => {
  const busy: QueueInput = {
    ...empty,
    jobs: Array.from({ length: 6 }, (_, i) => job(`j${i}`, { status: "Applying", deadline: `2026-12-0${i + 1}` })),
    contactActions: [person("r", "reply", "2026-11-20"), person("e1", "engage", "2026-11-22"), person("e2", "follow", "2026-11-21")],
  };

  it("orders groups applications, follow-ups, people, most overdue first inside each", () => {
    const q = buildDailyQueue(busy, TODAY, 30);
    expect(q.items.map((i) => i.key)).toEqual([
      "job:j0:apply", "job:j1:apply", "job:j2:apply", "job:j3:apply", "job:j4:apply", "job:j5:apply",
      "contact:r:reply",
      "contact:e2:follow", "contact:e1:engage",
    ]);
    expect(q.hiddenCount).toBe(0);
    expect(q.totals).toEqual({ applications: 6, followups: 1, people: 2 });
  });

  it("gives every non-empty group a slot before filling in order", () => {
    const q = buildDailyQueue(busy, TODAY, 4);
    expect(q.items.map((i) => i.key)).toEqual(["job:j0:apply", "job:j1:apply", "contact:r:reply", "contact:e2:follow"]);
    expect(q.hiddenCount).toBe(5);
  });

  it("clamps the limit to 3..30 and defaults bad values to 10", () => {
    expect(clampLimit(1)).toBe(3);
    expect(clampLimit(99)).toBe(30);
    expect(clampLimit("7")).toBe(7);
    expect(clampLimit("abc")).toBe(10);
    expect(clampLimit(null)).toBe(3);
    expect(buildDailyQueue(busy, TODAY, 1).items).toHaveLength(3);
  });
});

describe("AC-4 done, skipped, snoozed", () => {
  const input: QueueInput = { ...empty, contactActions: [person("a", "reply", TODAY), person("b", "reply", TODAY), person("c", "reply", TODAY)] };

  it("hides an item through its event's date and shows it again after", () => {
    const events = [
      { itemKey: "contact:a:reply", action: "skipped" as const, effectiveUntil: TODAY },
      { itemKey: "contact:b:reply", action: "snoozed" as const, effectiveUntil: "2026-11-28" },
      { itemKey: "contact:c:reply", action: "done" as const, effectiveUntil: "2026-11-25" }, // yesterday's
    ];
    expect(buildDailyQueue({ ...input, events }, TODAY).items.map((i) => i.key)).toEqual(["contact:c:reply"]);
    expect(buildDailyQueue({ ...input, events }, "2026-11-27").items.map((i) => i.key)).toEqual(["contact:a:reply", "contact:c:reply"]);
    expect(buildDailyQueue({ ...input, events }, "2026-11-29").items).toHaveLength(3);
  });

  it("computes how long each action hides an item", () => {
    expect(effectiveUntil("done", TODAY)).toBe(TODAY);
    expect(effectiveUntil("skipped", TODAY)).toBe(TODAY);
    expect(effectiveUntil("snoozed", TODAY, 1)).toBe(TODAY);
    expect(effectiveUntil("snoozed", TODAY, 3)).toBe("2026-11-28");
    expect(effectiveUntil("snoozed", TODAY, 7)).toBe("2026-12-02");
  });
});

describe("AC-5 and AC-11", () => {
  it("never lists the same item twice", () => {
    const q = buildDailyQueue({ ...empty, contactActions: [person("a", "reply", TODAY), person("a", "reply", TODAY)] }, TODAY);
    expect(q.items).toHaveLength(1);
  });

  it("is empty when nothing is due", () => {
    expect(buildDailyQueue(empty, TODAY)).toEqual({ items: [], hiddenCount: 0, totals: { applications: 0, followups: 0, people: 0 } });
  });
});

describe("REQ-008 fresh high-fit jobs", () => {
  const fresh = (id: string, over: Partial<NonNullable<QueueInput["freshJobs"]>[number]> = {}) => ({ id, title: "Backend Engineer", company: `New${id}`, jobUrl: `https://x.co/${id}`, ageHours: 5, datePosted: true, ...over });

  it("lead the applications group, ahead of overdue applications", () => {
    const q = buildDailyQueue({ ...empty, jobs: [job("1", { status: "Applying", deadline: "2026-11-01" })], freshJobs: [fresh("a")] }, TODAY, 10);
    expect(q.items.map((i) => i.key)).toEqual(["found:a:fresh", "job:1:apply"]);
    expect(q.items[0]).toMatchObject({ group: "applications", source: "found", target: { type: "found", id: "a", url: "https://x.co/a" } });
    expect(q.items[0].reason).toBe("Posted 5 hours ago · matches your campaign, nothing in the posting rules you out");
  });

  it("says First seen when the source gave no date, and takes at most three", () => {
    const q = collectItems({ ...empty, freshJobs: [fresh("a", { datePosted: false, ageHours: 0.2 }), fresh("b"), fresh("c"), fresh("d")] }, TODAY);
    expect(q).toHaveLength(3);
    expect(q[0].reason).toMatch(/^First seen in the last hour/);
  });

  it("can be hidden like any other item", () => {
    const q = buildDailyQueue({ ...empty, freshJobs: [fresh("a")], events: [{ itemKey: "found:a:fresh", action: "skipped", effectiveUntil: "2026-11-29" }] }, TODAY, 10);
    expect(q.items).toEqual([]);
  });
});

