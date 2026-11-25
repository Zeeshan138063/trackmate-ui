import { describe, expect, it } from "vitest";
import {
  ASK_MAX_CHARS,
  availableAsks,
  buildDraftPrompt,
  checkDraft,
  DraftInputError,
  draftSimilarity,
  recommendedAsk,
  senderFacts,
} from "./message-draft";

const amna = { name: "Amna Khan", position: "Engineering Manager", company: "Acme", relationship: "Met at PyCon Lahore", notes: "She leads the payments team and posted about hiring backend engineers." };
const me = { firstName: "Zee", targetTitle: "Backend Engineer", facts: ["Currently Senior Engineer at Kad", "Built JobOS"] };

describe("ask ladder", () => {
  it("offers only a connection request before the user is connected", () => {
    expect(availableAsks("identified", false)).toEqual(["connect"]);
    expect(availableAsks("engaged", true)).toEqual(["connect"]);
  });

  it("advice and a call once connected; a referral only after a real exchange at In conversation or above", () => {
    expect(availableAsks("connected", true)).toEqual(["advice", "call"]);
    expect(availableAsks("in_conversation", false)).toEqual(["advice", "call"]);
    expect(availableAsks("in_conversation", true)).toEqual(["advice", "call", "referral"]);
    expect(availableAsks("advocate", true)).toContain("referral");
    expect(availableAsks("advocate", false)).not.toContain("referral");
  });

  it("recommends the next rung", () => {
    expect(recommendedAsk("following", false)).toBe("connect");
    expect(recommendedAsk("connected", false)).toBe("advice");
    expect(recommendedAsk("in_conversation", true)).toBe("call");
    expect(recommendedAsk("advocate", true)).toBe("referral");
    expect(recommendedAsk("advocate", false)).toBe("advice");
  });
});

describe("buildDraftPrompt", () => {
  it("includes the user's notes, the allowed facts, the ask and the truth rules", () => {
    const p = buildDraftPrompt(amna, me, "advice");
    expect(p).toContain("Met at PyCon Lahore");
    expect(p).toContain("posted about hiring backend engineers");
    expect(p).toContain("- Currently Senior Engineer at Kad");
    expect(p).toContain('first name, "Amna"');
    expect(p).toContain("ask one specific question for their advice");
    expect(p).toContain("Use ONLY what is written above");
    expect(p).toContain(`At most ${ASK_MAX_CHARS.advice} characters`);
  });

  it("refuses to draft with no notes about the person", () => {
    expect(() => buildDraftPrompt({ name: "Amna Khan", company: "Acme", notes: "  ", relationship: "" }, me, "connect")).toThrow(DraftInputError);
  });

  it("tells the model to cite no proof when there are no facts", () => {
    expect(buildDraftPrompt(amna, { firstName: "Zee", facts: [] }, "connect")).toContain("do not cite any proof");
  });
});

describe("checkDraft", () => {
  const good = "Hi Amna, we met at PyCon Lahore and I saw your post about hiring backend engineers. I lead backend work at Kad. Could I ask how your team approaches payment retries?";

  it("accepts a draft that greets by name, fits the limit and has no placeholders", () => {
    expect(checkDraft(good, "advice", amna)).toEqual({ ok: true, problems: [] });
  });

  it("rejects empty, too long, unnamed and placeholder drafts", () => {
    expect(checkDraft("  ", "advice", amna).ok).toBe(false);
    expect(checkDraft(good + " x".repeat(200), "connect", amna).problems[0]).toMatch(/limit is 300/);
    expect(checkDraft("Hello there, could I ask a question?", "advice", amna).problems).toContain("It does not greet Amna by name.");
    expect(checkDraft("Hi Amna, I admire [Company]. Can we connect?", "connect", amna).problems).toContain("It still contains a placeholder in brackets.");
  });

  it("rejects a draft that is another contact's draft with the name swapped", () => {
    const forBilal = good.replace("Amna", "Bilal");
    const r = checkDraft(good, "advice", amna, [{ name: "Bilal Ahmed", text: forBilal }]);
    expect(r.ok).toBe(false);
    expect(r.problems[0]).toMatch(/almost the same as your draft for Bilal Ahmed/);
  });

  it("accepts a draft that differs from the others, and ignores empty saved drafts", () => {
    const other = "Hi Bilal, thanks for the talk on data pipelines last week. Would you have 15 minutes for a call about how your team hires?";
    expect(checkDraft(good, "advice", amna, [{ name: "Bilal Ahmed", text: other }, { name: "Empty", text: "" }]).ok).toBe(true);
  });
});

describe("draftSimilarity", () => {
  it("is 1 for the same text, 0 for unrelated text, and ignores the names", () => {
    expect(draftSimilarity("Hi Amna, can we connect about payments work?", "Hi Bilal, can we connect about payments work?", ["Amna", "Bilal"])).toBe(1);
    expect(draftSimilarity("Thanks for the talk on pipelines last week", "Could we meet about hiring plans in Riyadh next month")).toBe(0);
  });
});

describe("senderFacts", () => {
  it("takes facts from the Master Profile only", () => {
    expect(senderFacts({
      targetTitle: "Backend Engineer",
      experience: [{ position: "Engineer", company: "Old Co", current: false }, { position: "Senior Engineer", company: "Kad", current: true }],
      projects: [{ name: "JobOS" }, { name: "" }, { name: "Third" }],
    })).toEqual(["Currently Senior Engineer at Kad", "Built JobOS", "Looking for Backend Engineer roles"]);
    expect(senderFacts(null)).toEqual([]);
    expect(senderFacts({})).toEqual([]);
  });
});
